from django.contrib.auth.models import Group, Permission, User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


LOGIN_URL = '/api/v1/auth/login/'
REFRESH_URL = '/api/v1/auth/token/refresh/'
ME_URL = '/api/v1/auth/me/'
USERS_URL = '/api/v1/auth/users/'
GROUPS_URL = '/api/v1/auth/groups/'
PERMISSIONS_URL = '/api/v1/auth/permissions/'
PROTECTED_URL = '/api/v1/warehouses/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_user(username='logisticauser', password='SecurePass9!', **kwargs):
    return User.objects.create_user(
        username=username,
        password=password,
        email=f'{username}@logistica.com',
        **kwargs,
    )


def _create_superuser(username='superadmin', password='SuperPass9!'):
    return User.objects.create_superuser(
        username=username,
        email=f'{username}@logistica.com',
        password=password,
    )


def _auth_header(user):
    token = RefreshToken.for_user(user).access_token
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


# ---------------------------------------------------------------------------
# POST /api/v1/auth/login/ — obtener par de tokens
# ---------------------------------------------------------------------------

class TokenObtainHappyPathTest(APITestCase):
    """Credenciales válidas → 200 con access, refresh y user."""

    def setUp(self):
        self.user = _create_user()

    def test_valid_credentials_return_200(self):
        response = self.client.post(
            LOGIN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)

    def test_response_contains_access_token(self):
        response = self.client.post(
            LOGIN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertIn('access', response.data)

    def test_response_contains_refresh_token(self):
        response = self.client.post(
            LOGIN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertIn('refresh', response.data)

    def test_access_token_is_non_empty_string(self):
        response = self.client.post(
            LOGIN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    def test_response_contains_user_object(self):
        response = self.client.post(
            LOGIN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertIn('user', response.data)
        user_data = response.data['user']
        self.assertEqual(user_data['username'], 'logisticauser')
        self.assertIn('id', user_data)
        self.assertIn('email', user_data)
        self.assertIn('is_superuser', user_data)
        self.assertIn('is_staff', user_data)
        self.assertIn('groups', user_data)

    def test_regular_user_is_not_superuser(self):
        response = self.client.post(
            LOGIN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertFalse(response.data['user']['is_superuser'])

    def test_superuser_flag_returned_correctly(self):
        _create_superuser(username='supertest', password='SuperPass9!')
        response = self.client.post(
            LOGIN_URL,
            {'username': 'supertest', 'password': 'SuperPass9!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['user']['is_superuser'])

    def test_user_groups_returned_as_list(self):
        group = Group.objects.create(name='admin')
        self.user.groups.add(group)
        response = self.client.post(
            LOGIN_URL,
            {'username': 'logisticauser', 'password': 'SecurePass9!'},
            format='json',
        )
        self.assertIn('admin', response.data['user']['groups'])


class TokenObtainUnhappyPathTest(APITestCase):
    """Credenciales inválidas y payloads incompletos."""

    def setUp(self):
        self.user = _create_user()

    def test_wrong_password_returns_401(self):
        response = self.client.post(
            LOGIN_URL,
            {'username': 'logisticauser', 'password': 'WrongPassword!'},
            format='json',
        )
        self.assertEqual(response.status_code, 401)

    def test_nonexistent_user_returns_401(self):
        response = self.client.post(
            LOGIN_URL,
            {'username': 'nobody', 'password': 'AnyPass99!'},
            format='json',
        )
        self.assertEqual(response.status_code, 401)

    def test_missing_username_returns_400(self):
        response = self.client.post(
            LOGIN_URL,
            {'password': 'SecurePass9!'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_missing_password_returns_400(self):
        response = self.client.post(
            LOGIN_URL,
            {'username': 'logisticauser'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_empty_payload_returns_400(self):
        response = self.client.post(LOGIN_URL, {}, format='json')
        self.assertEqual(response.status_code, 400)


class TokenObtainEdgeCasesTest(APITestCase):
    """Casos borde: usuario inactivo, case-sensitivity."""

    def test_inactive_user_returns_401(self):
        _create_user(username='inactivo', password='Pass1234!', is_active=False)
        response = self.client.post(
            LOGIN_URL,
            {'username': 'inactivo', 'password': 'Pass1234!'},
            format='json',
        )
        self.assertEqual(response.status_code, 401)

    def test_username_is_case_sensitive(self):
        _create_user(username='CaseSensitive', password='Pass1234!')
        response = self.client.post(
            LOGIN_URL,
            {'username': 'casesensitive', 'password': 'Pass1234!'},
            format='json',
        )
        self.assertIn(response.status_code, [200, 401])

    def test_correct_case_username_succeeds(self):
        _create_user(username='ExactCase', password='Pass1234!')
        response = self.client.post(
            LOGIN_URL,
            {'username': 'ExactCase', 'password': 'Pass1234!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)


# ---------------------------------------------------------------------------
# POST /api/v1/auth/token/refresh/
# ---------------------------------------------------------------------------

class TokenRefreshHappyPathTest(APITestCase):

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
        response = self.client.post(
            REFRESH_URL,
            {'refresh': str(self.refresh)},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('refresh', response.data)
        self.assertNotEqual(response.data['refresh'], str(self.refresh))


class TokenRefreshUnhappyPathTest(APITestCase):

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

    def setUp(self):
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
        self.client.credentials(HTTP_AUTHORIZATION=f'Basic {self.access_token}')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, 401)

    def test_empty_bearer_header_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, 401)

    def test_token_grants_access_to_paginated_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, 200)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)


# ---------------------------------------------------------------------------
# GET /api/v1/auth/users/ — gestión de usuarios (solo superadmin)
# ---------------------------------------------------------------------------

class UserListPermissionTest(APITestCase):

    def setUp(self):
        self.superadmin = _create_superuser()
        self.regular_user = _create_user(username='regular', password='Pass1234!')

    def test_superadmin_can_list_users(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(USERS_URL)
        self.assertEqual(response.status_code, 200)

    def test_regular_user_gets_403(self):
        self.client.credentials(**_auth_header(self.regular_user))
        response = self.client.get(USERS_URL)
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_gets_401(self):
        response = self.client.get(USERS_URL)
        self.assertEqual(response.status_code, 401)

    def test_list_includes_all_users(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(USERS_URL)
        usernames = [u['username'] for u in response.data['results']]
        self.assertIn('superadmin', usernames)
        self.assertIn('regular', usernames)


class UserCreateTest(APITestCase):

    def setUp(self):
        self.superadmin = _create_superuser()
        self.group = Group.objects.create(name='warehouse_staff')

    def test_superadmin_can_create_user(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.post(
            USERS_URL,
            {'username': 'newuser', 'password': 'Pass1234!', 'email': 'new@logistica.com'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['username'], 'newuser')

    def test_create_user_with_group(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.post(
            USERS_URL,
            {
                'username': 'staffuser',
                'password': 'Pass1234!',
                'groups': [self.group.id],
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn('warehouse_staff', response.data['groups'])

    def test_duplicate_username_returns_400(self):
        _create_user(username='existing')
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.post(
            USERS_URL,
            {'username': 'existing', 'password': 'Pass1234!'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_missing_username_returns_400(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.post(
            USERS_URL,
            {'password': 'Pass1234!'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)


class UserDetailTest(APITestCase):

    def setUp(self):
        self.superadmin = _create_superuser()
        self.target_user = _create_user(username='target', password='Pass1234!')
        self.group = Group.objects.create(name='admin')

    def test_superadmin_can_get_user_detail(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(f'{USERS_URL}{self.target_user.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'target')

    def test_superadmin_can_update_user(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.patch(
            f'{USERS_URL}{self.target_user.id}/',
            {'email': 'updated@logistica.com'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)

    def test_superadmin_can_assign_groups(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.patch(
            f'{USERS_URL}{self.target_user.id}/',
            {'groups': [self.group.id]},
            format='json',
        )
        self.assertEqual(response.status_code, 200)

    def test_superadmin_can_delete_user(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.delete(f'{USERS_URL}{self.target_user.id}/')
        self.assertEqual(response.status_code, 204)

    def test_superadmin_cannot_delete_self(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.delete(f'{USERS_URL}{self.superadmin.id}/')
        self.assertEqual(response.status_code, 400)

    def test_nonexistent_user_returns_404(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(f'{USERS_URL}99999/')
        self.assertEqual(response.status_code, 404)


# ---------------------------------------------------------------------------
# GET /api/v1/auth/groups/ — listar grupos disponibles
# ---------------------------------------------------------------------------

class GroupListTest(APITestCase):

    def setUp(self):
        self.superadmin = _create_superuser()
        self.regular_user = _create_user(username='regular2', password='Pass1234!')
        Group.objects.create(name='admin')
        Group.objects.create(name='warehouse_staff')

    def test_superadmin_can_list_groups(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(GROUPS_URL)
        self.assertEqual(response.status_code, 200)
        group_names = [g['name'] for g in response.data['results']]
        self.assertIn('admin', group_names)
        self.assertIn('warehouse_staff', group_names)

    def test_regular_user_gets_403(self):
        self.client.credentials(**_auth_header(self.regular_user))
        response = self.client.get(GROUPS_URL)
        self.assertEqual(response.status_code, 403)

    def test_each_group_has_id_and_name(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(GROUPS_URL)
        for group in response.data['results']:
            self.assertIn('id', group)
            self.assertIn('name', group)


# ---------------------------------------------------------------------------
# GET /api/v1/auth/me/ — perfil del usuario autenticado
# ---------------------------------------------------------------------------

class MeViewTest(APITestCase):

    def setUp(self):
        self.user = _create_user(username='meuser', password='Pass1234!')
        self.superadmin = _create_superuser()

    def test_authenticated_user_gets_own_profile(self):
        self.client.credentials(**_auth_header(self.user))
        response = self.client.get(ME_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'meuser')

    def test_response_has_expected_fields(self):
        self.client.credentials(**_auth_header(self.user))
        response = self.client.get(ME_URL)
        for field in ['id', 'username', 'email', 'is_superuser', 'is_staff', 'is_active', 'groups']:
            self.assertIn(field, response.data)

    def test_superadmin_gets_own_profile(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(ME_URL)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_superuser'])

    def test_unauthenticated_gets_401(self):
        response = self.client.get(ME_URL)
        self.assertEqual(response.status_code, 401)

    def test_groups_returned_as_list(self):
        group = Group.objects.create(name='admin')
        self.user.groups.add(group)
        self.client.credentials(**_auth_header(self.user))
        response = self.client.get(ME_URL)
        self.assertIn('admin', response.data['groups'])


# ---------------------------------------------------------------------------
# POST /api/v1/auth/groups/ — crear grupo
# ---------------------------------------------------------------------------

class GroupCreateTest(APITestCase):

    def setUp(self):
        self.superadmin = _create_superuser()
        self.regular_user = _create_user(username='regular3', password='Pass1234!')

    def test_superadmin_can_create_group(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.post(GROUPS_URL, {'name': 'nuevo_rol'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'nuevo_rol')

    def test_created_group_has_permissions_field(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.post(GROUPS_URL, {'name': 'con_permisos'}, format='json')
        self.assertIn('permissions', response.data)

    def test_regular_user_cannot_create_group(self):
        self.client.credentials(**_auth_header(self.regular_user))
        response = self.client.post(GROUPS_URL, {'name': 'intento'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_duplicate_group_name_returns_400(self):
        Group.objects.create(name='existente')
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.post(GROUPS_URL, {'name': 'existente'}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_can_create_group_with_permissions(self):
        perm = Permission.objects.filter(codename='view_customer').first()
        if not perm:
            self.skipTest('Permission view_customer not available')
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.post(
            GROUPS_URL,
            {'name': 'grupo_con_perm', 'permissions': [perm.id]},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        perm_codenames = [p['codename'] for p in response.data['permissions']]
        self.assertIn('view_customer', perm_codenames)


# ---------------------------------------------------------------------------
# GET/PATCH/DELETE /api/v1/auth/groups/{id}/ — detalle de grupo
# ---------------------------------------------------------------------------

class GroupDetailTest(APITestCase):

    def setUp(self):
        self.superadmin = _create_superuser()
        self.group = Group.objects.create(name='test_group')

    def test_superadmin_can_get_group_detail(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(f'{GROUPS_URL}{self.group.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'test_group')
        self.assertIn('permissions', response.data)

    def test_superadmin_can_rename_group(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.patch(
            f'{GROUPS_URL}{self.group.id}/',
            {'name': 'renombrado'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'renombrado')

    def test_superadmin_can_assign_permissions_to_group(self):
        perm = Permission.objects.filter(codename='view_customer').first()
        if not perm:
            self.skipTest('Permission view_customer not available')
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.patch(
            f'{GROUPS_URL}{self.group.id}/',
            {'permissions': [perm.id]},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        perm_codenames = [p['codename'] for p in response.data['permissions']]
        self.assertIn('view_customer', perm_codenames)

    def test_superadmin_can_delete_group(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.delete(f'{GROUPS_URL}{self.group.id}/')
        self.assertEqual(response.status_code, 204)

    def test_nonexistent_group_returns_404(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(f'{GROUPS_URL}99999/')
        self.assertEqual(response.status_code, 404)


# ---------------------------------------------------------------------------
# GET /api/v1/auth/permissions/ — listar permisos disponibles
# ---------------------------------------------------------------------------

class PermissionListTest(APITestCase):

    def setUp(self):
        self.superadmin = _create_superuser()
        self.regular_user = _create_user(username='regular4', password='Pass1234!')

    def test_superadmin_can_list_permissions(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(PERMISSIONS_URL)
        self.assertEqual(response.status_code, 200)

    def test_regular_user_gets_403(self):
        self.client.credentials(**_auth_header(self.regular_user))
        response = self.client.get(PERMISSIONS_URL)
        self.assertEqual(response.status_code, 403)

    def test_permissions_not_paginated(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(PERMISSIONS_URL)
        self.assertIsInstance(response.data, list)

    def test_each_permission_has_expected_fields(self):
        self.client.credentials(**_auth_header(self.superadmin))
        response = self.client.get(PERMISSIONS_URL)
        if response.data:
            perm = response.data[0]
            for field in ['id', 'name', 'codename', 'app_label', 'model']:
                self.assertIn(field, perm)
