"""
Admin configuration for tasks app.
"""
from django.contrib import admin
from .models import Task, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin interface for Category model."""
    
    list_display = ['name', 'usage_frequency', 'color_code', 'created_at']
    list_filter = ['created_at', 'usage_frequency']
    search_fields = ['name', 'description']
    ordering = ['-usage_frequency', 'name']
    readonly_fields = ['usage_frequency', 'created_at', 'updated_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin interface for Task model."""
    
    list_display = [
        'title', 'user', 'category', 'status', 'priority', 
        'priority_score', 'deadline', 'is_overdue', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'category', 'created_at', 
        'deadline', 'user'
    ]
    search_fields = ['title', 'description', 'tags', 'user__username']
    readonly_fields = [
        'priority_score', 'ai_enhanced_description', 'ai_suggested_deadline',
        'ai_suggested_category', 'context_relevance_score', 'completed_at',
        'is_overdue', 'urgency_level', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'created_at'
    ordering = ['-priority_score', '-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'user', 'category', 'tags')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority', 'priority_score')
        }),
        ('Time Management', {
            'fields': ('deadline', 'estimated_duration', 'completed_at')
        }),
        ('AI Enhancement', {
            'fields': (
                'ai_enhanced_description', 'ai_suggested_deadline',
                'ai_suggested_category', 'context_relevance_score'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('is_overdue', 'urgency_level', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_completed', 'mark_pending', 'recalculate_priority']
    
    def mark_completed(self, request, queryset):
        """Mark selected tasks as completed."""
        from django.utils import timezone
        updated = queryset.update(status='completed', completed_at=timezone.now())
        self.message_user(request, f'{updated} tasks marked as completed.')
    mark_completed.short_description = "Mark selected tasks as completed"
    
    def mark_pending(self, request, queryset):
        """Mark selected tasks as pending."""
        updated = queryset.update(status='pending', completed_at=None)
        self.message_user(request, f'{updated} tasks marked as pending.')
    mark_pending.short_description = "Mark selected tasks as pending"
    
    def recalculate_priority(self, request, queryset):
        """Recalculate priority scores using AI."""
        try:
            from ai_module.services import AITaskService
            ai_service = AITaskService()
            updated_count = 0
            
            for task in queryset:
                try:
                    ai_service.recalculate_priority(task)
                    updated_count += 1
                except Exception:
                    continue
            
            self.message_user(request, f'{updated_count} task priorities recalculated.')
        except ImportError:
            self.message_user(request, 'AI service not available.', level='ERROR')
    recalculate_priority.short_description = "Recalculate priority scores with AI" 