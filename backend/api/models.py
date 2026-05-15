from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser):
    ROLE_CHOICES = [('PERSONNEL', 'Personnel'), ('SUPERVISOR', 'Supervisor'), ('MANAGER', 'Manager'), ('ADMIN', 'Admin')]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='PERSONNEL')
    created_at = models.DateTimeField(auto_now_add=True) 
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['role', 'is_active'])]

class Driver(models.Model):
    STATUS_CHOICES = [('ACTIVE', 'Active'), ('INACTIVE', 'Inactive')]

    id = models.AutoField(primary_key=True)  
    code = models.CharField(max_length=20, unique=True, editable=False)  
    name = models.CharField(max_length=100, db_index=True)
    contact = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_archived = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['status', 'is_archived'])]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.code:
            self.code = f"DRV{str(self.id).zfill(3)}"
            super().save(update_fields=['code'])

    def __str__(self):
        return self.name


class Route(models.Model):
    """
    Represents a jeepney route. The destination is always San Fernando.
    Only the origin (e.g. 'Lingsat', 'Tanqui') is variable.
    The full display name is always '<origin> - San Fernando'.
    """
    DESTINATION = "San Fernando"

    origin = models.CharField(max_length=100, unique=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['origin']

    @property
    def full_name(self):
        return f"{self.origin} - {self.DESTINATION}"

    def __str__(self):
        return self.full_name


class Vehicle(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('DISPATCHED', 'Dispatched'),
        ('MAINTENANCE', 'Maintenance'),
        ('QUEUED', 'Queued'),
    ]

    id = models.AutoField(primary_key=True)   
    code = models.CharField(max_length=20, unique=True, editable=False)
    plate_number = models.CharField(unique=True, max_length=20, db_index=True)
    route = models.ForeignKey(
        'Route',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='vehicles',
        db_index=True,
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    active_driver = models.ForeignKey('Driver', null=True, blank=True, on_delete=models.SET_NULL, related_name='vehicles')
    is_archived = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'is_archived']),
            models.Index(fields=['route', 'is_archived']),
        ]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.code:
            self.code = f"VHC{str(self.id).zfill(3)}"
            super().save(update_fields=['code'])


class Ticket(models.Model):
    STATUS_CHOICES = [('ISSUED', 'Issued'), ('DISPATCHED', 'Dispatched'), ('COLLECTED', 'Collected'), ('CANCELLED', 'Cancelled'), ('RETURNED', 'Returned')]
    
    id = models.CharField(max_length=50, primary_key=True)

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='tickets')
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='tickets')
    active_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets', null=True, blank=True)

    route = models.CharField(max_length=100, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ISSUED')
    collection_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    issued_at = models.DateTimeField(auto_now_add=True, db_index=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    nullified_at = models.DateTimeField(null=True, blank=True)
    is_late = models.BooleanField(default=False, db_index=True)  # True = issued late (missed intended batch)
    intended_batch = models.CharField(max_length=20, blank=True)  # e.g. "Batch 1" — the batch it should have been in
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'is_verified']),
            models.Index(fields=['issued_at', 'status']),
        ]

    def save(self, *args, **kwargs):
        if not self.collection_amount:
            latest_price = TicketPrice.objects.order_by('-effective_date').first()
            if latest_price:
                self.collection_amount = latest_price.amount
            # If no price exists, leave as null — backend will use fallback
        super().save(*args, **kwargs)

class TicketPrice(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    effective_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-effective_date']

    def __str__(self):
        return f"{self.amount} (effective {self.effective_date})"