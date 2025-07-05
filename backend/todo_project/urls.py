"""
URL configuration for todo_project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import UserSignupView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication URLs
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/signup/', UserSignupView.as_view(), name='user_signup'),
    
    # App URLs
    path('api/tasks/', include('tasks.urls')),
    path('api/context/', include('context.urls')),
    path('api/ai/', include('ai_module.urls')),
] 