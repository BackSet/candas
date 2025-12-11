from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.report.api.views import ReportViewSet, ReportDetailViewSet
from apps.report.api.views_schedule import ReportScheduleViewSet

# Router para los viewsets
router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'report-details', ReportDetailViewSet, basename='report-detail')
router.register(r'report-schedules', ReportScheduleViewSet, basename='report-schedule')

urlpatterns = [
    path('', include(router.urls)),
]
