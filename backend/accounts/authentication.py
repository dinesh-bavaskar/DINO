from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.models import TokenUser


class EmployeeJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        if validated_token.get('employee_id'):
            return TokenUser(validated_token)
        return super().get_user(validated_token)
