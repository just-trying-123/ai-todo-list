"""
App configuration for tasks.
"""
from django.apps import AppConfig


class TasksConfig(AppConfig):
    """Configuration for tasks app."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tasks'
    verbose_name = 'Task Management'
    
    def ready(self):
        """Import signals when app is ready."""
        try:
            import tasks.signals  # noqa
        except ImportError:
            pass 