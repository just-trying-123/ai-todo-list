"""
Serializers for the tasks application.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task, Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'color_code', 
            'usage_frequency', 'created_at', 'updated_at'
        ]
        read_only_fields = ['usage_frequency', 'created_at', 'updated_at']
    
    def validate_color_code(self, value):
        """Validate color code format."""
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError("Color code must be in #RRGGBB format")
        return value


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""
    category = CategorySerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color_code', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    urgency_level = serializers.ReadOnlyField()
    is_completed = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'user', 'category', 'category_name', 
            'category_color', 'status', 'priority', 'priority_score', 'deadline',
            'estimated_duration', 'completed_at', 'ai_enhanced_description',
            'ai_suggested_deadline', 'ai_suggested_category', 'context_relevance_score',
            'tags', 'is_overdue', 'urgency_level', 'created_at', 'updated_at', 'is_completed'
        ]
        read_only_fields = [
            'user', 'completed_at', 'ai_enhanced_description', 'ai_suggested_deadline',
            'ai_suggested_category', 'context_relevance_score', 'priority_score',
            'created_at', 'updated_at', 'is_completed'
        ]

    def get_is_completed(self, obj):
        return obj.status == 'completed'
    
    def validate_priority_score(self, value):
        """Validate priority score range."""
        if not 0.0 <= value <= 10.0:
            raise serializers.ValidationError("Priority score must be between 0.0 and 10.0")
        return value
    
    def validate_deadline(self, value):
        """Validate deadline is in the future."""
        if value:
            from django.utils import timezone
            if value <= timezone.now():
                raise serializers.ValidationError("Deadline must be in the future")
        return value
    
    def validate_tags(self, value):
        """Validate tags format."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list")
        
        for tag in value:
            if not isinstance(tag, str):
                raise serializers.ValidationError("Each tag must be a string")
            if len(tag.strip()) == 0:
                raise serializers.ValidationError("Tags cannot be empty")
        
        return [tag.strip().lower() for tag in value if tag.strip()]


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tasks with AI enhancement."""
    
    request_ai_enhancement = serializers.BooleanField(default=True, write_only=True)
    context_data = serializers.ListField(
        child=serializers.CharField(max_length=1000),
        required=False,
        write_only=True,
        help_text="Context data for AI enhancement"
    )
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'category', 'priority', 'deadline',
            'estimated_duration', 'tags', 'request_ai_enhancement', 'context_data'
        ]
    
    def create(self, validated_data):
        """Create task with AI enhancement if requested. Ignore provided category and use AI-assigned category."""
        request_ai_enhancement = validated_data.pop('request_ai_enhancement', True)
        context_data = validated_data.pop('context_data', [])
        # Remove any provided category
        validated_data.pop('category', None)
        # Set user from request
        validated_data['user'] = self.context['request'].user
        task = Task.objects.create(**validated_data)
        # Request AI enhancement if needed
        if request_ai_enhancement:
            from ai_module.services import AITaskService
            ai_service = AITaskService()
            import logging
            logger = logging.getLogger(__name__)
            try:
                suggestions = ai_service.enhance_task(task, context_data)
                logger.info(f"AI suggestions for task {task.id}: {suggestions}")
                # Assign AI-suggested category if present, else fallback to 'General'
                suggested_category = suggestions.get('suggested_category') or 'General'
                category_obj, created = Category.objects.get_or_create(
                    name=suggested_category,
                    defaults={"color_code": "#3B82F6"}
                )
                if not category_obj.color_code:
                    category_obj.color_code = "#3B82F6"
                    category_obj.save()
                task.category = category_obj
                task.save()
            except Exception as e:
                # Log error but don't fail task creation
                logger.error(f"AI enhancement failed for task {task.id}: {str(e)}")
        return task


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating tasks."""
    is_completed = serializers.BooleanField(required=False)

    class Meta:
        model = Task
        fields = [
            'title', 'description', 'category', 'status', 'priority',
            'deadline', 'estimated_duration', 'tags', 'is_completed'
        ]

    def validate(self, data):
        # Handle completion toggling
        is_completed = data.get('is_completed', None)
        if is_completed is not None:
            if is_completed:
                data['status'] = 'completed'
                from django.utils import timezone
                data['completed_at'] = timezone.now()
            else:
                data['status'] = 'pending'
                data['completed_at'] = None
        return data


class TaskStatsSerializer(serializers.Serializer):
    """Serializer for task statistics."""
    
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    pending_tasks = serializers.IntegerField()
    overdue_tasks = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    average_priority_score = serializers.FloatField()
    tasks_by_category = serializers.DictField()
    tasks_by_priority = serializers.DictField()
    recent_activity = serializers.ListField()


class TaskSuggestionSerializer(serializers.Serializer):
    """Serializer for AI task suggestions."""
    
    enhanced_description = serializers.CharField()
    suggested_deadline = serializers.DateTimeField()
    suggested_category = serializers.CharField()
    suggested_tags = serializers.ListField(child=serializers.CharField())
    priority_score = serializers.FloatField()
    reasoning = serializers.CharField()
    confidence_score = serializers.FloatField() 