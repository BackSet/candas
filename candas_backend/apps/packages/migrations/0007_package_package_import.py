# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('packages', '0006_packagestatushistory'),
    ]

    operations = [
        migrations.AddField(
            model_name='package',
            name='package_import',
            field=models.ForeignKey(
                blank=True,
                help_text='Importación desde la cual se creó este paquete',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='imported_packages',
                to='packages.packageimport',
                verbose_name='Importación'
            ),
        ),
    ]
