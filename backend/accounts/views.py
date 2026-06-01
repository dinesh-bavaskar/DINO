from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Employee
from .serializers import (
    EmployeeSerializer,
    RegisterEmployeeSerializer,
    AdminLoginSerializer,
    EmployeeLoginSerializer,
)


def get_tokens_for_employee(employee):
    """Generate JWT tokens using employee data as payload."""
    refresh = RefreshToken()
    refresh['employee_id'] = employee.employee_id
    refresh['role'] = employee.role
    refresh['full_name'] = employee.full_name
    refresh['email'] = employee.email
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        # Check Django superuser first
        user = authenticate(request, username=username, password=password)
        if user and user.is_superuser:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'role': 'admin',
                'full_name': user.get_full_name() or user.username,
                'employee_id': 'ADMIN',
            })

        # Also check Employee model with admin role
        try:
            employee = Employee.objects.get(employee_id=username, role='admin')
            if check_password(password, employee.password):
                tokens = get_tokens_for_employee(employee)
                tokens['role'] = 'admin'
                tokens['full_name'] = employee.full_name
                tokens['employee_id'] = employee.employee_id
                return Response(tokens)
        except Employee.DoesNotExist:
            pass

        return Response(
            {'detail': 'Invalid credentials or not an admin.'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class EmployeeLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmployeeLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        employee_id = serializer.validated_data['employee_id']
        password = serializer.validated_data['password']

        try:
            employee = Employee.objects.get(employee_id=employee_id, is_active=True)
        except Employee.DoesNotExist:
            return Response(
                {'detail': 'Employee not found or inactive.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not check_password(password, employee.password):
            return Response(
                {'detail': 'Invalid password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tokens = get_tokens_for_employee(employee)
        tokens['role'] = employee.role
        tokens['full_name'] = employee.full_name
        tokens['employee_id'] = employee.employee_id
        return Response(tokens)


class RegisterEmployeeView(APIView):
    """Admin only: Register a new employee."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check if requester is admin (superuser or has admin claim in token)
        is_superuser = request.user.is_superuser
        has_admin_role = hasattr(request.auth, 'get') and request.auth.get('role') == 'admin'
        if not (is_superuser or has_admin_role):
            return Response(
                {'detail': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = RegisterEmployeeSerializer(data=request.data)
        if serializer.is_valid():
            employee = serializer.save()
            return Response(
                EmployeeSerializer(employee).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployeeListView(APIView):
    """Admin only: Get list of all employees."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_superuser or
                (hasattr(request.auth, 'get') and request.auth.get('role') == 'admin')):
            return Response(
                {'detail': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        employees = Employee.objects.filter(role='employee')
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)


class EmployeeProfileView(APIView):
    """Employee: Get own profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get employee_id from JWT token payload
        token = request.auth
        employee_id = token.get('employee_id') if hasattr(token, 'get') else None

        if not employee_id:
            # Superuser/admin case
            return Response({
                'employee_id': 'ADMIN',
                'full_name': request.user.get_full_name() or request.user.username,
                'email': request.user.email,
                'department': 'Management',
                'designation': 'System Administrator',
                'role': 'admin',
            })

        try:
            employee = Employee.objects.get(employee_id=employee_id)
            serializer = EmployeeSerializer(employee)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response(
                {'detail': 'Employee not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class EmployeeStatsView(APIView):
    """Admin only: Get dashboard statistics."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_employees = Employee.objects.filter(role='employee').count()
        active_employees = Employee.objects.filter(role='employee', is_active=True).count()
        departments = Employee.objects.filter(role='employee').values('department').distinct().count()

        return Response({
            'total_employees': total_employees,
            'active_employees': active_employees,
            'departments': departments,
        })
