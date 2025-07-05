"""
Models for the context application.
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class ContextEntry(models.Model):
    """Model for storing daily context data."""
    
    SOURCE_TYPES = [
        ('whatsapp', 'WhatsApp Message'),
        ('email', 'Email'),
        ('note', 'Personal Note'),
        ('calendar', 'Calendar Event'),
        ('reminder', 'Reminder'),
        ('meeting', 'Meeting Notes'),
        ('call', 'Phone Call'),
        ('other', 'Other'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    # Basic information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='context_entries')
    content = models.TextField(help_text="The actual content of the message/note/email")
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES, default='note')
    source_details = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Additional source information (sender, subject, etc.)"
    )
    
    # Context metadata
    context_date = models.DateTimeField(help_text="When this context occurred")
    priority_level = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    
    # AI processing results
    processed_insights = models.JSONField(
        default=dict,
        blank=True,
        help_text="AI-extracted insights and keywords"
    )
    sentiment_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(-1.0), MaxValueValidator(1.0)],
        help_text="Sentiment analysis score (-1 to 1)"
    )
    keywords = models.JSONField(
        default=list,
        blank=True,
        help_text="Extracted keywords and phrases"
    )
    entities = models.JSONField(
        default=list,
        blank=True,
        help_text="Extracted entities (people, places, dates, etc.)"
    )
    
    # Task relevance
    task_suggestions = models.JSONField(
        default=list,
        blank=True,
        help_text="AI-suggested tasks based on this context"
    )
    relevance_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(10.0)],
        help_text="How relevant this context is for task management"
    )
    
    # Status tracking
    is_processed = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-context_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'context_date']),
            models.Index(fields=['source_type', 'priority_level']),
            models.Index(fields=['is_processed']),
        ]
        verbose_name_plural = "Context Entries"
    
    def __str__(self):
        return f"{self.get_source_type_display()} - {self.content[:50]}..."
    
    @property
    def excerpt(self):
        """Return a short excerpt of the content."""
        return self.content[:100] + "..." if len(self.content) > 100 else self.content
    
    @property
    def has_tasks_suggestions(self):
        """Check if this context has task suggestions."""
        return len(self.task_suggestions) > 0
    
    def mark_as_processed(self):
        """Mark this context entry as processed."""
        self.is_processed = True
        self.save()
    
    def add_task_suggestion(self, suggestion):
        """Add a task suggestion to this context."""
        if not self.task_suggestions:
            self.task_suggestions = []
        self.task_suggestions.append(suggestion)
        self.save()


class ContextInsight(models.Model):
    """Model for storing aggregated insights from context analysis."""
    
    INSIGHT_TYPES = [
        ('pattern', 'Behavioral Pattern'),
        ('trend', 'Trend Analysis'),
        ('recommendation', 'AI Recommendation'),
        ('summary', 'Daily Summary'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='context_insights')
    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Related context entries
    context_entries = models.ManyToManyField(ContextEntry, blank=True)
    
    # Insight metadata
    confidence_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    date_range_start = models.DateTimeField()
    date_range_end = models.DateTimeField()
    
    # Actions and suggestions
    suggested_actions = models.JSONField(default=list, blank=True)
    is_actionable = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'insight_type']),
            models.Index(fields=['date_range_start', 'date_range_end']),
        ]
    
    def __str__(self):
        return f"{self.get_insight_type_display()}: {self.title}" 