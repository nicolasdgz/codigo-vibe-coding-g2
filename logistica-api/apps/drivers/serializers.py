from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Driver


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class DriverReadSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = Driver
        fields = [
            'id', 'user', 'license_number', 'license_expiry',
            'phone', 'is_available', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DriverWriteSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Driver
        fields = ['id', 'user', 'license_number', 'license_expiry', 'phone', 'is_available']
        read_only_fields = ['id']
