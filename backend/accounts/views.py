from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Employee
from .serializers import (
    EmployeeSerializer,
    RegisterEmployeeSerializer,
    AdminLoginSerializer,
    EmployeeLoginSerializer,
    UpdateEmployeeSerializer,
)


class StandardResultsPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


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

        employee_identifier = serializer.validated_data['employee_id']
        password = serializer.validated_data['password']

        try:
            employee = Employee.objects.get(
                Q(employee_id=employee_identifier) | Q(email__iexact=employee_identifier),
                is_active=True
            )
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
        search = request.query_params.get('search')
        if search:
            employees = employees.filter(
                Q(full_name__icontains=search) |
                Q(employee_id__icontains=search) |
                Q(email__icontains=search) |
                Q(department__icontains=search) |
                Q(designation__icontains=search)
            )

        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(employees, request)
        serializer = EmployeeSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class EmployeeStatusView(APIView):
    """Admin only: Activate or deactivate an employee."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not (request.user.is_superuser or
                (hasattr(request.auth, 'get') and request.auth.get('role') == 'admin')):
            return Response(
                {'detail': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            employee = Employee.objects.get(pk=pk, role='employee')
        except Employee.DoesNotExist:
            return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)

        employee.is_active = bool(request.data.get('is_active'))
        employee.save(update_fields=['is_active'])
        return Response(EmployeeSerializer(employee).data)


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


class EmployeeDetailView(APIView):
    """Admin only: Retrieve or update employee details."""
    permission_classes = [IsAuthenticated]

    def get_employee(self, pk):
        try:
            return Employee.objects.get(pk=pk, role='employee')
        except Employee.DoesNotExist:
            return None

    def get(self, request, pk):
        # Check admin role
        is_superuser = request.user.is_superuser
        has_admin_role = hasattr(request.auth, 'get') and request.auth.get('role') == 'admin'
        if not (is_superuser or has_admin_role):
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        employee = self.get_employee(pk)
        if not employee:
            return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(EmployeeSerializer(employee).data)

    def put(self, request, pk):
        # Check admin role
        is_superuser = request.user.is_superuser
        has_admin_role = hasattr(request.auth, 'get') and request.auth.get('role') == 'admin'
        if not (is_superuser or has_admin_role):
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        employee = self.get_employee(pk)
        if not employee:
            return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateEmployeeSerializer(employee, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(EmployeeSerializer(employee).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
