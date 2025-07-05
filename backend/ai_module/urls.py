from django.urls import path
from . import views

urlpatterns = [
    # Task AI endpoints
    path('tasks/<int:task_id>/enhance/', views.enhance_task, name='enhance_task'),
    path('tasks/recommendations/', views.get_task_recommendations, name='task_recommendations'),
    path('tasks/suggest-from-context/', views.suggest_tasks_from_context, name='suggest_tasks'),
    
    # Context AI endpoints
    path('context/<int:context_id>/analyze/', views.analyze_context, name='analyze_context'),
    path('context/summary/', views.generate_context_summary, name='context_summary'),
    path('context/bulk-process/', views.bulk_process_context, name='bulk_process_context'),
    
    # Insights endpoints
    path('insights/daily/', views.generate_daily_insights, name='daily_insights'),
    path('insights/productivity/', views.analyze_productivity_patterns, name='productivity_patterns'),
    
    # General AI endpoints
    path('health/', views.ai_health_check, name='ai_health_check'),
] 