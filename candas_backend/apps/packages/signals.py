from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Package


@receiver(pre_save, sender=Package)
def log_status_change(sender, instance: Package, **kwargs):
	"""Append status changes with timestamp to status_history."""
	# On create, record initial status
	if not instance.pk:
		if instance.status:
			ts = timezone.now().strftime('%d/%m/%Y %H:%M')
			entry = f"[{ts}] {instance.get_status_display()}\n"
			instance.status_history = (instance.status_history or '') + entry
		return

	# On update, compare previous status
	try:
		prev = Package.objects.get(pk=instance.pk)
	except Package.DoesNotExist:
		return
	if prev.status != instance.status:
		ts = timezone.now().strftime('%d/%m/%Y %H:%M')
		entry = f"[{ts}] {instance.get_status_display()}\n"
		instance.status_history = (instance.status_history or '') + entry


@receiver(pre_save, sender=Package)
def log_notes_change(sender, instance: Package, **kwargs):
	"""Append notes changes with timestamp to notes_history."""
	# On create, record initial notes if present
	if not instance.pk:
		if instance.notes:
			ts = timezone.now().strftime('%d/%m/%Y %H:%M')
			entry = f"[{ts}] Notas iniciales: {instance.notes}\n"
			instance.notes_history = (instance.notes_history or '') + entry
		return

	# On update, compare previous notes
	try:
		prev = Package.objects.get(pk=instance.pk)
	except Package.DoesNotExist:
		return
	if (prev.notes or '') != (instance.notes or ''):
		ts = timezone.now().strftime('%d/%m/%Y %H:%M')
		entry = f"[{ts}] Notas actualizadas: {instance.notes}\n"
		instance.notes_history = (instance.notes_history or '') + entry
