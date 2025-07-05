"""
Serializers for the context application.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ContextEntry, ContextInsight


class ContextEntrySerializer(serializers.ModelSerializer):
    """Serializer for ContextEntry model."""
    
    excerpt = serializers.ReadOnlyField()
    has_tasks_suggestions = serializers.ReadOnlyField()
    
    class Meta:
        model = ContextEntry
        fields = [
            'id', 'content', 'source_type', 'source_details', 'context_date',
            'priority_level', 'processed_insights', 'sentiment_score', 'keywords',
            'entities', 'task_suggestions', 'relevance_score', 'is_processed',
            'is_archived', 'excerpt', 'has_tasks_suggestions', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'user', 'processed_insights', 'sentiment_score', 'keywords', 'entities',
            'task_suggestions', 'relevance_score', 'is_processed', 'created_at', 'updated_at'
        ]
    
    def validate_content(self, value):
        """Validate content length and format."""
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Content must be at least 5 characters long")
        return value.strip()
    
    def validate_context_date(self, value):
        """Validate context date."""
        from django.utils import timezone
        from datetime import timedelta
        
        # Allow dates up to 30 days in the past and 1 day in the future
        now = timezone.now()
        min_date = now - timedelta(days=30)
        max_date = now + timedelta(days=1)
        
        if value < min_date:
            raise serializers.ValidationError("Context date cannot be more than 30 days in the past")
        if value > max_date:
            raise serializers.ValidationError("Context date cannot be more than 1 day in the future")
        
        return value
    
    def validate_source_details(self, value):
        """Validate source details format."""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Source details must be a valid JSON object")
        return value


class ContextEntryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating context entries with AI processing."""
    
    request_ai_processing = serializers.BooleanField(default=True, write_only=True)
    
    class Meta:
        model = ContextEntry
        fields = [
            'content', 'source_type', 'source_details', 'context_date',
            'priority_level', 'request_ai_processing'
        ]
    
    def create(self, validated_data):
        """Create context entry with AI processing if requested."""
        request_ai_processing = validated_data.pop('request_ai_processing', True)
        
        # Set user from request
        validated_data['user'] = self.context['request'].user
        
        context_entry = ContextEntry.objects.create(**validated_data)
        
        # Request AI processing if needed
        if request_ai_processing:
            from ai_module.services import AIContextService
            ai_service = AIContextService()
            try:
                ai_service.process_context(context_entry)
            except Exception as e:
                # Log error but don't fail context creation
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"AI processing failed for context {context_entry.id}: {str(e)}")
        
        return context_entry


class ContextInsightSerializer(serializers.ModelSerializer):
    """Serializer for ContextInsight model."""
    
    context_entries_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ContextInsight
        fields = [
            'id', 'insight_type', 'title', 'description', 'confidence_score',
            'date_range_start', 'date_range_end', 'suggested_actions',
            'is_actionable', 'is_dismissed', 'context_entries_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_context_entries_count(self, obj):
        """Get the count of related context entries."""
        return obj.context_entries.count()


class ContextStatsSerializer(serializers.Serializer):
    """Serializer for context statistics."""
    
    total_entries = serializers.IntegerField()
    processed_entries = serializers.IntegerField()
    unprocessed_entries = serializers.IntegerField()
    entries_by_source = serializers.DictField()
    entries_by_priority = serializers.DictField()
    average_sentiment = serializers.FloatField()
    average_relevance = serializers.FloatField()
    total_task_suggestions = serializers.IntegerField()
    recent_insights = serializers.ListField()


class ContextSummarySerializer(serializers.Serializer):
    """Serializer for daily/weekly context summaries."""
    
    date_range = serializers.CharField()
    total_entries = serializers.IntegerField()
    key_themes = serializers.ListField(child=serializers.CharField())
    sentiment_trend = serializers.CharField()
    task_suggestions_count = serializers.IntegerField()
    priority_distribution = serializers.DictField()
    most_relevant_entries = serializers.ListField()
    ai_insights = serializers.ListField()


class ContextAnalysisSerializer(serializers.Serializer):
    """Serializer for AI context analysis results."""
    
    keywords = serializers.ListField(child=serializers.CharField())
    entities = serializers.ListField()
    sentiment_score = serializers.FloatField()
    sentiment_label = serializers.CharField()
    relevance_score = serializers.FloatField()
    task_suggestions = serializers.ListField()
    themes = serializers.ListField(child=serializers.CharField())
    urgency_indicators = serializers.ListField(child=serializers.CharField())
    confidence_score = serializers.FloatField()


class BulkContextSerializer(serializers.Serializer):
    """Serializer for bulk context entry operations."""
    
    entries = serializers.ListField(
        child=ContextEntryCreateSerializer(),
        min_length=1,
        max_length=50
    )
    request_ai_processing = serializers.BooleanField(default=True)
    
    def create(self, validated_data):
        """Create multiple context entries."""
        entries_data = validated_data['entries']
        request_ai_processing = validated_data.get('request_ai_processing', True)
        user = self.context['request'].user
        
        created_entries = []
        
        for entry_data in entries_data:
            entry_data['user'] = user
            context_entry = ContextEntry.objects.create(**entry_data)
            created_entries.append(context_entry)
            
            # Process with AI if requested
            if request_ai_processing:
                try:
                    from ai_module.services import AIContextService
                    ai_service = AIContextService()
                    ai_service.process_context(context_entry)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"AI processing failed for context {context_entry.id}: {str(e)}")
        
        return created_entries 