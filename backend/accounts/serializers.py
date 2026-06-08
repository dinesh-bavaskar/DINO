from rest_framework import serializers
from .models import Employee
from django.contrib.auth.hashers import make_password, check_password


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'email',
            'department', 'designation', 'role', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class RegisterEmployeeSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = Employee
        fields = [
            'employee_id', 'full_name', 'email',
            'department', 'designation', 'password', 'confirm_password', 'role'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if Employee.objects.filter(employee_id=data['employee_id']).exists():
            raise serializers.ValidationError({"employee_id": "Employee ID already exists."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data['password'] = make_password(validated_data['password'])
        return Employee.objects.create(**validated_data)


class AdminLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class EmployeeLoginSerializer(serializers.Serializer):
    employee_id = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UpdateEmployeeSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Employee
        fields = [
            'employee_id', 'full_name', 'email',
            'department', 'designation', 'password', 'confirm_password', 'is_active'
        ]

    def validate(self, data):
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        if password or confirm_password:
            if password != confirm_password:
                raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        # Explicit uniqueness validations ignoring current instance
        employee_id = data.get('employee_id')
        if employee_id and self.instance:
            if Employee.objects.filter(employee_id=employee_id).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError({"employee_id": "Employee ID already exists."})

        email = data.get('email')
        if email and self.instance:
            if Employee.objects.filter(email__iexact=email).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError({"email": "Email already exists."})

        return data

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        validated_data.pop('confirm_password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.password = make_password(password)

        instance.save()
        return instance

