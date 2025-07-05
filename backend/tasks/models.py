"""
Models for the tasks application.
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    """Task category model."""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    color_code = models.CharField(max_length=7, default='#3B82F6')  # Default blue
    usage_frequency = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['-usage_frequency', 'name']
    
    def __str__(self):
        return self.name
    
    def increment_usage(self):
        """Increment usage frequency when category is used."""
        self.usage_frequency += 1
        self.save()


class Task(models.Model):
    """Task model with AI-enhanced features."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    # Basic task information
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Status and priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    priority_score = models.FloatField(
        default=50.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="AI-calculated priority score (0-100)"
    )
    
    # Time-related fields
    deadline = models.DateTimeField(null=True, blank=True)
    estimated_duration = models.DurationField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # AI-enhanced fields
    ai_enhanced_description = models.TextField(blank=True, null=True)
    ai_suggested_deadline = models.DateTimeField(null=True, blank=True)
    ai_suggested_category = models.CharField(max_length=100, blank=True, null=True)
    context_relevance_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(10.0)]
    )
    
    # Tags for better organization
    tags = models.JSONField(default=list, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority_score', '-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['priority_score']),
            models.Index(fields=['deadline']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"
    
    def save(self, *args, **kwargs):
        """Override save to update category usage frequency."""
        # Mark as completed
        if self.status == 'completed' and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
        
        # Increment category usage
        if self.category:
            self.category.increment_usage()
        
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        """Check if task is overdue."""
        if not self.deadline:
            return False
        from django.utils import timezone
        return timezone.now() > self.deadline and self.status != 'completed'
    
    @property
    def urgency_level(self):
        """Calculate urgency based on deadline and priority."""
        if not self.deadline:
            return self.priority_score
        
        from django.utils import timezone
        import datetime
        
        now = timezone.now()
        if self.deadline <= now:
            return 10.0  # Overdue
        
        time_left = self.deadline - now
        days_left = time_left.days
        
        if days_left <= 1:
            return min(10.0, self.priority_score + 3)
        elif days_left <= 3:
            return min(10.0, self.priority_score + 2)
        elif days_left <= 7:
            return min(10.0, self.priority_score + 1)
        
        return self.priority_score 