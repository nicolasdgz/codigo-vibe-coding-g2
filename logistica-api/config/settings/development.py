from decouple import config
from .base import *

DEBUG = True

SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-do-not-use-in-production')

ALLOWED_HOSTS = ['*']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

CORS_ALLOW_ALL_ORIGINS = True
