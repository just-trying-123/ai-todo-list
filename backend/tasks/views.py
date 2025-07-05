from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta

from .models import Task, Category
from .serializers import (
    TaskSerializer, CategorySerializer, TaskCreateSerializer,
    TaskUpdateSerializer, TaskStatsSerializer, TaskSuggestionSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category management."""
    
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'usage_frequency', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Return categories with usage statistics."""
        return Category.objects.all()  # type: ignore[attr-defined]
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular categories."""
        categories = Category.objects.filter(usage_frequency__gt=0).order_by('-usage_frequency')[:10]  # type: ignore[attr-defined]
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for Task management with AI features."""
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'deadline', 'priority_score']
    ordering = ['-priority_score', '-created_at']
    
    def get_queryset(self):
        print("ORDERING PARAM:", self.request.GET.get('ordering'))
        # Only filter by user; let DRF handle ordering/filtering
        return Task.objects.filter(user=self.request.user)  # type: ignore[attr-defined]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        return TaskSerializer
    
    def perform_create(self, serializer):
        """Create task with user assignment."""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get task statistics for the user."""
        user_tasks = self.get_queryset()
        
        total_tasks = user_tasks.count()
        completed_tasks = user_tasks.filter(status='completed').count()
        pending_tasks = user_tasks.filter(status='pending').count()
        overdue_tasks = user_tasks.filter(
            deadline__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        ).count()
        
        completion_rate = (completed_tasks / total_tasks) if total_tasks > 0 else 0
        avg_priority = user_tasks.aggregate(avg_priority=Avg('priority_score'))['avg_priority'] or 0
        
        # Tasks by category
        tasks_by_category = dict(
            user_tasks.values('category__name')
            .annotate(count=Count('id'))
            .values_list('category__name', 'count')
        )
        
        # Tasks by priority
        tasks_by_priority = dict(
            user_tasks.values('priority')
            .annotate(count=Count('id'))
            .values_list('priority', 'count')
        )
        
        # Recent activity (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_activity = user_tasks.filter(
            updated_at__gte=week_ago
        ).order_by('-updated_at')[:10].values(
            'id', 'title', 'status', 'updated_at'
        )
        
        stats_data = {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'overdue_tasks': overdue_tasks,
            'completion_rate': round(completion_rate, 2),
            'average_priority_score': round(avg_priority, 2),
            'tasks_by_category': tasks_by_category,
            'tasks_by_priority': tasks_by_priority,
            'recent_activity': list(recent_activity)
        }
        
        serializer = TaskStatsSerializer(data=stats_data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue tasks."""
        overdue_tasks = self.get_queryset().filter(
            deadline__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        ).order_by('deadline')
        
        serializer = self.get_serializer(overdue_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get tasks due today."""
        today = timezone.now().date()
        today_tasks = self.get_queryset().filter(
            deadline__date=today,
            status__in=['pending', 'in_progress']
        ).order_by('deadline')
        
        serializer = self.get_serializer(today_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark task as completed."""
        task = self.get_object()
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def ai_enhance(self, request, pk=None):
        """Enhance task with AI-powered suggestions."""
        try:
            task = self.get_object()
            
            # Get context data for enhancement
            context_data = request.data.get('context_data', [])
            
            from ai_module.services import AITaskService
            ai_service = AITaskService()
            result = ai_service.enhance_task(task, context_data)
            
            # Return updated task data
            serializer = self.get_serializer(task)
            return Response({
                'success': True,
                'task': serializer.data,
                'enhancements': result,
                'message': 'Task enhanced successfully'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def ai_recommendations(self, request):
        """Get AI-powered task recommendations."""
        try:
            limit = int(request.query_params.get('limit', 5))
            
            from ai_module.services import AITaskService
            ai_service = AITaskService()
            recommendations = ai_service.get_task_recommendations(self.request.user, limit)
            
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
    
    @action(detail=True, methods=['post'])
    def recalculate_priority(self, request, pk=None):
        """Recalculate task priority using AI."""
        try:
            task = self.get_object()
            
            from ai_module.services import AITaskService
            ai_service = AITaskService()
            new_priority = ai_service.recalculate_priority(task)
            
            serializer = self.get_serializer(task)
            return Response({
                'success': True,
                'task': serializer.data,
                'new_priority_score': new_priority,
                'message': 'Priority recalculated successfully'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 