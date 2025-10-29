from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_add_tenant_application_model'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='id_document',
            field=models.FileField(upload_to='id_documents/', null=True, blank=True),
        ),
    ]
