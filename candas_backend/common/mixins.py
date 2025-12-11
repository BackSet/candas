"""
View Mixins - Mixins reutilizables para vistas
"""
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.shortcuts import redirect


class MessageMixin:
    """Mixin para agregar mensajes de éxito/error automáticamente"""
    
    success_message = "Operación completada exitosamente."
    error_message = "Ocurrió un error al procesar la solicitud."
    
    def form_valid(self, form):
        messages.success(self.request, self.success_message)
        return super().form_valid(form)
    
    def form_invalid(self, form):
        messages.error(self.request, self.error_message)
        return super().form_invalid(form)


class BreadcrumbMixin:
    """Mixin para gestionar breadcrumbs"""
    
    breadcrumbs = []
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['breadcrumbs'] = self.breadcrumbs
        return context


class PaginationMixin:
    """Mixin para paginación consistente"""
    
    paginate_by = 25
    
    def get_paginate_by(self, queryset):
        return self.request.GET.get('per_page', self.paginate_by)
