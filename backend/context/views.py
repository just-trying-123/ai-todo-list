"""
Views for the context application.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta, datetime

from .models import ContextEntry, ContextInsight
from .serializers import (
    ContextEntrySerializer, ContextEntryCreateSerializer, ContextInsightSerializer,
    ContextStatsSerializer, ContextSummarySerializer, ContextAnalysisSerializer,
    BulkContextSerializer
)


class ContextEntryViewSet(viewsets.ModelViewSet):
    """ViewSet for ContextEntry management."""
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['source_type', 'priority_level', 'is_processed', 'is_archived']
    search_fields = ['content', 'keywords', 'entities']
    ordering_fields = ['context_date', 'created_at', 'relevance_score', 'sentiment_score']
    ordering = ['-context_date', '-created_at']
    
    def get_queryset(self):
        """Return context entries for the authenticated user."""
        return ContextEntry.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ContextEntryCreateSerializer
        elif self.action == 'bulk_create':
            return BulkContextSerializer
        return ContextEntrySerializer
    
    def perform_create(self, serializer):
        """Create context entry with user assignment."""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get context statistics for the user."""
        user_entries = self.get_queryset()
        
        total_entries = user_entries.count()
        processed_entries = user_entries.filter(is_processed=True).count()
        unprocessed_entries = total_entries - processed_entries
        
        # Entries by source type
        entries_by_source = dict(
            user_entries.values('source_type')
            .annotate(count=Count('id'))
            .values_list('source_type', 'count')
        )
        
        # Entries by priority level
        entries_by_priority = dict(
            user_entries.values('priority_level')
            .annotate(count=Count('id'))
            .values_list('priority_level', 'count')
        )
        
        # Average sentiment and relevance
        avg_sentiment = user_entries.aggregate(avg_sentiment=Avg('sentiment_score'))['avg_sentiment'] or 0
        avg_relevance = user_entries.aggregate(avg_relevance=Avg('relevance_score'))['avg_relevance'] or 0
        
        # Total task suggestions
        total_task_suggestions = sum(
            len(entry.task_suggestions) for entry in user_entries 
            if entry.task_suggestions
        )
        
        # Recent insights
        recent_insights = user_entries.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')[:5].values(
            'id', 'excerpt', 'source_type', 'context_date'
        )
        
        stats_data = {
            'total_entries': total_entries,
            'processed_entries': processed_entries,
            'unprocessed_entries': unprocessed_entries,
            'entries_by_source': entries_by_source,
            'entries_by_priority': entries_by_priority,
            'average_sentiment': round(avg_sentiment, 2),
            'average_relevance': round(avg_relevance, 2),
            'total_task_suggestions': total_task_suggestions,
            'recent_insights': list(recent_insights)
        }
        
        serializer = ContextStatsSerializer(data=stats_data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent context entries."""
        days = int(request.query_params.get('days', 7))
        cutoff_date = timezone.now() - timedelta(days=days)
        
        recent_entries = self.get_queryset().filter(
            context_date__gte=cutoff_date
        ).order_by('-context_date')
        
        page = self.paginate_queryset(recent_entries)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(recent_entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unprocessed(self, request):
        """Get unprocessed context entries."""
        unprocessed = self.get_queryset().filter(is_processed=False)
        serializer = self.get_serializer(unprocessed, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def high_relevance(self, request):
        """Get high relevance context entries."""
        high_relevance = self.get_queryset().filter(
            relevance_score__gte=7.0
        ).order_by('-relevance_score')
        
        serializer = self.get_serializer(high_relevance, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def with_suggestions(self, request):
        """Get context entries that have task suggestions."""
        with_suggestions = self.get_queryset().exclude(
            task_suggestions=[]
        ).order_by('-context_date')
        
        serializer = self.get_serializer(with_suggestions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        """Request AI analysis for a specific context entry."""
        try:
            context_entry = self.get_object()
            
            from ai_module.services import AIContextService
            ai_service = AIContextService()
            analysis_result = ai_service.analyze_context(context_entry)
            
            serializer = ContextAnalysisSerializer(data=analysis_result)
            serializer.is_valid(raise_exception=True)
            return Response({
                'success': True,
                'context_id': context_entry.id,
                'analysis': analysis_result,
                'message': 'Context analyzed successfully'
            })
            
        except Exception as e:
            return Response(
                {'success': False, 'error': f'AI analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple context entries at once."""
        serializer = BulkContextSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        created_entries = serializer.save()
        
        response_serializer = ContextEntrySerializer(created_entries, many=True)
        return Response(
            {
                'success': True,
                'message': f'{len(created_entries)} context entries created successfully',
                'entries': response_serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def bulk_process(self, request):
        """Process multiple context entries with AI."""
        try:
            entry_ids = request.data.get('entry_ids', [])
            
            if not entry_ids:
                return Response(
                    {'success': False, 'error': 'entry_ids is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            entries = self.get_queryset().filter(id__in=entry_ids, is_processed=False)
            processed_count = 0
            results = []
            
            from ai_module.services import AIContextService
            ai_service = AIContextService()
            
            for entry in entries:
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
                'total_count': len(entries),
                'results': results
            })
            
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get AI-generated summary of context entries."""
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
            
            context_entries = self.get_queryset().filter(
                context_date__date__range=[start_date, end_date]
            )
            
            from ai_module.services import AIContextService
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
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ContextInsightViewSet(viewsets.ModelViewSet):
    """ViewSet for ContextInsight management."""
    
    serializer_class = ContextInsightSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['insight_type', 'is_actionable', 'is_dismissed']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'confidence_score']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return insights for the authenticated user."""
        return ContextInsight.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create insight with user assignment."""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def actionable(self, request):
        """Get actionable insights."""
        actionable_insights = self.get_queryset().filter(
            is_actionable=True,
            is_dismissed=False
        ).order_by('-confidence_score')
        
        serializer = self.get_serializer(actionable_insights, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss an insight."""
        insight = self.get_object()
        insight.is_dismissed = True
        insight.save()
        
        serializer = self.get_serializer(insight)
        return Response(serializer.data) 