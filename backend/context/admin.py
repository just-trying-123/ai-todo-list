"""
Admin configuration for context app.
"""
from django.contrib import admin
from .models import ContextEntry, ContextInsight


@admin.register(ContextEntry)
class ContextEntryAdmin(admin.ModelAdmin):
    """Admin interface for ContextEntry model."""
    
    list_display = [
        'excerpt', 'user', 'source_type', 'priority_level', 
        'relevance_score', 'sentiment_score', 'is_processed', 'context_date'
    ]
    list_filter = [
        'source_type', 'priority_level', 'is_processed', 'is_archived',
        'context_date', 'created_at'
    ]
    search_fields = ['content', 'keywords', 'user__username']
    readonly_fields = [
        'processed_insights', 'sentiment_score', 'keywords', 'entities',
        'task_suggestions', 'relevance_score', 'is_processed',
        'created_at', 'updated_at'
    ]
    date_hierarchy = 'context_date'
    ordering = ['-context_date', '-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'content', 'source_type', 'source_details', 'context_date')
        }),
        ('Priority & Status', {
            'fields': ('priority_level', 'is_archived')
        }),
        ('AI Processing Results', {
            'fields': (
                'processed_insights', 'sentiment_score', 'keywords', 'entities',
                'task_suggestions', 'relevance_score', 'is_processed'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_processed', 'mark_unprocessed', 'archive_entries', 'reprocess_ai']
    
    def mark_processed(self, request, queryset):
        """Mark selected entries as processed."""
        updated = queryset.update(is_processed=True)
        self.message_user(request, f'{updated} entries marked as processed.')
    mark_processed.short_description = "Mark selected entries as processed"
    
    def mark_unprocessed(self, request, queryset):
        """Mark selected entries as unprocessed."""
        updated = queryset.update(is_processed=False)
        self.message_user(request, f'{updated} entries marked as unprocessed.')
    mark_unprocessed.short_description = "Mark selected entries as unprocessed"
    
    def archive_entries(self, request, queryset):
        """Archive selected entries."""
        updated = queryset.update(is_archived=True)
        self.message_user(request, f'{updated} entries archived.')
    archive_entries.short_description = "Archive selected entries"
    
    def reprocess_ai(self, request, queryset):
        """Reprocess selected entries with AI."""
        try:
            from ai_module.services import AIContextService
            ai_service = AIContextService()
            processed_count = 0
            
            for entry in queryset:
                try:
                    ai_service.process_context(entry)
                    processed_count += 1
                except Exception:
                    continue
            
            self.message_user(request, f'{processed_count} entries reprocessed with AI.')
        except ImportError:
            self.message_user(request, 'AI service not available.', level='ERROR')
    reprocess_ai.short_description = "Reprocess with AI"


@admin.register(ContextInsight)
class ContextInsightAdmin(admin.ModelAdmin):
    """Admin interface for ContextInsight model."""
    
    list_display = [
        'title', 'user', 'insight_type', 'confidence_score',
        'is_actionable', 'is_dismissed', 'created_at'
    ]
    list_filter = [
        'insight_type', 'is_actionable', 'is_dismissed', 'created_at'
    ]
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'insight_type', 'title', 'description')
        }),
        ('Insight Details', {
            'fields': ('confidence_score', 'date_range_start', 'date_range_end')
        }),
        ('Actions & Status', {
            'fields': ('suggested_actions', 'is_actionable', 'is_dismissed')
        }),
        ('Related Context', {
            'fields': ('context_entries',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_actionable', 'dismiss_insights']
    
    def mark_actionable(self, request, queryset):
        """Mark selected insights as actionable."""
        updated = queryset.update(is_actionable=True, is_dismissed=False)
        self.message_user(request, f'{updated} insights marked as actionable.')
    mark_actionable.short_description = "Mark as actionable"
    
    def dismiss_insights(self, request, queryset):
        """Dismiss selected insights."""
        updated = queryset.update(is_dismissed=True)
        self.message_user(request, f'{updated} insights dismissed.')
    dismiss_insights.short_description = "Dismiss insights" 