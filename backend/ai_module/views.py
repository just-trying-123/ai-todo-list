"""
Views for AI module functionality.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from tasks.models import Task
from context.models import ContextEntry
from .services import AITaskService, AIContextService, AIInsightService


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enhance_task(request, task_id):
    """Enhance a task with AI-powered suggestions."""
    try:
        task = get_object_or_404(Task, id=task_id, user=request.user)
        
        # Get context data for enhancement
        context_data = request.data.get('context_data', [])
        
        ai_service = AITaskService()
        result = ai_service.enhance_task(task, context_data)
        
        return Response({
            'success': True,
            'task_id': task.id,
            'enhancements': result,
            'message': 'Task enhanced successfully'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_task_recommendations(request):
    """Get AI-powered task recommendations for the user."""
    try:
        limit = int(request.query_params.get('limit', 5))
        
        ai_service = AITaskService()
        recommendations = ai_service.get_task_recommendations(request.user, limit)
        
        return Response({
            'success': True,
            'recommendations': recommendations,
            'count': len(recommendations)
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suggest_tasks_from_context(request):
    """Suggest tasks based on context entries."""
    try:
        context_ids = request.data.get('context_ids', [])
        
        if not context_ids:
            return Response({
                'success': False,
                'error': 'context_ids is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        context_entries = ContextEntry.objects.filter(
            id__in=context_ids,
            user=request.user
        )
        
        ai_service = AITaskService()
        suggestions = ai_service.suggest_tasks_from_context(context_entries)
        
        return Response({
            'success': True,
            'suggestions': suggestions,
            'count': len(suggestions)
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_context(request, context_id):
    """Analyze a specific context entry with AI."""
    try:
        context_entry = get_object_or_404(ContextEntry, id=context_id, user=request.user)
        
        ai_service = AIContextService()
        analysis = ai_service.analyze_context(context_entry)
        
        return Response({
            'success': True,
            'context_id': context_entry.id,
            'analysis': analysis,
            'message': 'Context analyzed successfully'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_context_summary(request):
    """Generate AI summary of context entries."""
    try:
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        days = int(request.query_params.get('days', 7))
        
        if start_date and end_date:
            start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=days)
        
        context_entries = ContextEntry.objects.filter(
            user=request.user,
            context_date__date__range=[start_date, end_date]
        )
        
        ai_service = AIContextService()
        summary = ai_service.generate_summary(context_entries, start_date, end_date)
        
        return Response({
            'success': True,
            'summary': summary,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'entry_count': context_entries.count()
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_process_context(request):
    """Process multiple context entries with AI."""
    try:
        context_ids = request.data.get('context_ids', [])
        
        if not context_ids:
            return Response({
                'success': False,
                'error': 'context_ids is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        context_entries = ContextEntry.objects.filter(
            id__in=context_ids,
            user=request.user
        )
        
        ai_service = AIContextService()
        processed_count = 0
        results = []
        
        for entry in context_entries:
            try:
                analysis = ai_service.process_context(entry)
                results.append({
                    'context_id': entry.id,
                    'analysis': analysis
                })
                processed_count += 1
            except Exception as e:
                results.append({
                    'context_id': entry.id,
                    'error': str(e)
                })
        
        return Response({
            'success': True,
            'processed_count': processed_count,
            'total_count': len(context_entries),
            'results': results
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_daily_insights(request):
    """Generate daily insights for the user."""
    try:
        date_str = request.query_params.get('date')
        date = None
        
        if date_str:
            date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
        
        ai_service = AIInsightService()
        insights = ai_service.generate_daily_insights(request.user, date)
        
        return Response({
            'success': True,
            'insights': insights,
            'count': len(insights),
            'date': date.isoformat() if date else timezone.now().date().isoformat()
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analyze_productivity_patterns(request):
    """Analyze productivity patterns for the user."""
    try:
        days = int(request.query_params.get('days', 30))
        
        ai_service = AIInsightService()
        analysis = ai_service.analyze_productivity_patterns(request.user, days)
        
        return Response({
            'success': True,
            'analysis': analysis,
            'period_days': days
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_health_check(request):
    """Check AI service health."""
    try:
        from django.conf import settings
        
        # Test AI service availability
        ai_service = AITaskService()
        
        return Response({
            'success': True,
            'ai_configured': bool(settings.GEMINI_API_KEY),
            'status': 'healthy',
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'status': 'unhealthy'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 