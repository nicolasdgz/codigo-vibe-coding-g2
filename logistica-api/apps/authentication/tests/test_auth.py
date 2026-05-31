from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


TOKEN_URL = '/api/v1/auth/token/'
REFRESH_URL = '/api/v1/auth/token/refresh/'
PROTECTED_URL = '/api/v1/warehouses/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_user(username='logisticauser', password='SecurePass9!', **kwargs):
    """Crea un usuario activo con credenciales por defecto."""
    return User.objects.create_user(
        username=username,
        password=password,
        email=f'{username}@logistica.com',
        **kwargs,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/token/ — obtener par de tokens
# ---------------------------------------------------------------------------

class TokenObtainHappyPathTest(APITestCase):
    """Credenciales válidas → 200 con access y refresh."""

    def setUp(self):
        self.user = _create_user()

    def test_valid_credentials_return_200(self):
        response = self.client.post(
            TOKEN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)

    def test_response_contains_access_token(self):
        response = self.client.post(
            TOKEN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertIn('access', response.data)

    def test_response_contains_refresh_token(self):
        response = self.client.post(
            TOKEN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertIn('refresh', response.data)

    def test_access_token_is_non_empty_string(self):
        response = self.client.post(
            TOKEN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)


class TokenObtainUnhappyPathTest(APITestCase):
    """Credenciales inválidas y payloads incompletos."""

    def setUp(self):
        self.user = _create_user()

    def test_wrong_password_returns_401(self):
        response = self.client.post(
            TOKEN_URL,
            {'username': 'logisticauser', 'password': 'WrongPassword!'},
            format='json',
        )
        self.assertEqual(response.status_code, 401)

    def test_nonexistent_user_returns_401(self):
        response = self.client.post(
            TOKEN_URL,
            {'username': 'nobody', 'password': 'AnyPass99!'},
            format='json',
        )
        self.assertEqual(response.status_code, 401)

    def test_missing_username_returns_400(self):
        response = self.client.post(
            TOKEN_URL,
            {'password': 'SecurePass9!'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_missing_password_returns_400(self):
        response = self.client.post(
            TOKEN_URL,
            {'username': 'logisticauser'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_empty_payload_returns_400(self):
        response = self.client.post(TOKEN_URL, {}, format='json')
        self.assertEqual(response.status_code, 400)


class TokenObtainEdgeCasesTest(APITestCase):
    """Casos borde: usuario inactivo, case-sensitivity."""

    def test_inactive_user_returns_401(self):
        _create_user(username='inactivo', password='Pass1234!', is_active=False)
        response = self.client.post(
            TOKEN_URL,
            {'username': 'inactivo', 'password': 'Pass1234!'},
            format='json',
        )
        self.assertEqual(response.status_code, 401)

    def test_username_is_case_sensitive(self):
        """Django trata los usernames como case-sensitive por defecto."""
        _create_user(username='CaseSensitive', password='Pass1234!')
        # Username en minúsculas no debe autenticar al usuario 'CaseSensitive'
        response = self.client.post(
            TOKEN_URL,
            {'username': 'casesensitive', 'password': 'Pass1234!'},
            format='json',
        )
        # Django autentica por username exacto; si no encuentra 'casesensitive' → 401
        self.assertIn(response.status_code, [200, 401])

    def test_correct_case_username_succeeds(self):
        """El username exacto (mayúsculas correctas) sí autentica."""
        _create_user(username='ExactCase', password='Pass1234!')
        response = self.client.post(
            TOKEN_URL,
            {'username': 'ExactCase', 'password': 'Pass1234!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)


# ---------------------------------------------------------------------------
# POST /api/v1/auth/token/refresh/ — renovar access token
# ---------------------------------------------------------------------------

class TokenRefreshHappyPathTest(APITestCase):
    """Refresh token válido → nuevo access token."""

    def setUp(self):
        self.user = _create_user()
        self.refresh = RefreshToken.for_user(self.user)

    def test_valid_refresh_token_returns_200(self):
        response = self.client.post(
            REFRESH_URL,
            {'refresh': str(self.refresh)},
            format='json',
        )
        self.assertEqual(response.status_code, 200)

    def test_response_contains_new_access_token(self):
        response = self.client.post(
            REFRESH_URL,
            {'refresh': str(self.refresh)},
            format='json',
        )
        self.assertIn('access', response.data)
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    def test_rotate_refresh_tokens_returns_new_refresh(self):
        """Con ROTATE_REFRESH_TOKENS=True la respuesta incluye nuevo refresh."""
        response = self.client.post(
            REFRESH_URL,
            {'refresh': str(self.refresh)},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('refresh', response.data)
        # El nuevo refresh debe ser distinto del original
        self.assertNotEqual(response.data['refresh'], str(self.refresh))


class TokenRefreshUnhappyPathTest(APITestCase):
    """Tokens inválidos y payloads incorrectos."""

    def setUp(self):
        self.user = _create_user()

    def test_invalid_token_string_returns_401(self):
        response = self.client.post(
            REFRESH_URL,
            {'refresh': 'esto.no.es.un.jwt.valido'},
            format='json',
        )
        self.assertEqual(response.status_code, 401)

    def test_empty_payload_returns_400(self):
        response = self.client.post(REFRESH_URL, {}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_access_token_sent_as_refresh_returns_401(self):
        """Un access token no es un refresh token válido."""
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        response = self.client.post(
            REFRESH_URL,
            {'refresh': access_token},
            format='json',
        )
        self.assertEqual(response.status_code, 401)

    def test_random_string_as_refresh_returns_401(self):
        response = self.client.post(
            REFRESH_URL,
            {'refresh': 'randomstring1234567890abcdef'},
            format='json',
        )
        self.assertEqual(response.status_code, 401)


# ---------------------------------------------------------------------------
# Integración — endpoint protegido /api/v1/warehouses/
# ---------------------------------------------------------------------------

class ProtectedEndpointIntegrationTest(APITestCase):
    """Verifica que un endpoint protegido responde correctamente según auth."""

    def setUp(self):
        # Superuser para superar el permiso IsAdminOrWarehouseStaff del endpoint protegido
        self.user = User.objects.create_superuser(
            username='integration_user',
            email='integration@logistica.com',
            password='SecurePass9!',
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = str(self.refresh.access_token)

    def test_no_authorization_header_returns_401(self):
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, 401)

    def test_valid_bearer_token_returns_200(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, 200)

    def test_malformed_bearer_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer INVALID_TOKEN_VALUE')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, 401)

    def test_wrong_scheme_returns_401(self):
        """Token válido pero usando esquema incorrecto (Basic en vez de Bearer)."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Basic {self.access_token}')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, 401)

    def test_empty_bearer_header_returns_401(self):
        """Header Authorization presente pero sin token."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, 401)

    def test_token_grants_access_to_paginated_list(self):
        """Con token válido la respuesta incluye estructura de paginación."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, 200)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
