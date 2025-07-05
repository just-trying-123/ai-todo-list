"""
App configuration for context.
"""
from django.apps import AppConfig


class ContextConfig(AppConfig):
    """Configuration for context app."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'context'
    verbose_name = 'Context Management'
    
    def ready(self):
        """Import signals when app is ready."""
        try:
            import context.signals  # noqa
        except ImportError:
            pass 