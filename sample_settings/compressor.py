# --------------- #
# COMMON SETTINGS #
# --------------- #

INSTALLED_APPS = (
    'compressor',
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',
)

STATIC_ROOT = os.path.join(BASE_DIR, 'compress_tmp')  # value doesn't matter


# ------------------- #
# PRODUCTION SETTINGS #
# ------------------- #

STATICFILES_STORAGE = 'hovel_annoying.compressor_utils.CachedStaticRootS3BotoStorage'
COMPRESS_STORAGE = STATICFILES_STORAGE
