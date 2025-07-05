from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContextEntryViewSet, ContextInsightViewSet

router = DefaultRouter()
router.register(r'entries', ContextEntryViewSet, basename='contextentry')
router.register(r'insights', ContextInsightViewSet, basename='contextinsight')

urlpatterns = [
    path('', include(router.urls)),
] 