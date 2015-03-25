# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from compressor.filters.css_default import CssAbsoluteFilter
from compressor.utils import staticfiles
from django.core.files.storage import get_storage_class
from hovel_annoying.storage_utils import StaticRootS3BotoStorage


class CachedStaticRootS3BotoStorage(StaticRootS3BotoStorage):
    def __init__(self, *args, **kwargs):
        super(CachedStaticRootS3BotoStorage, self).__init__(*args, **kwargs)
        Storage = get_storage_class('compressor.storage.CompressorFileStorage')
        self.local_storage = Storage()

    def save(self, name, content):
        name = super(CachedStaticRootS3BotoStorage, self).save(name, content)
        self.local_storage._save(name, content)
        return name


class DebugIndependentCssAbsoluteFilter(CssAbsoluteFilter):
    def find(self, basename):
        # This is the original condition with removed "settings.DEBUG and "
        # to provide the same functional on the production.
        if basename and staticfiles.finders:
            return staticfiles.finders.find(basename)
