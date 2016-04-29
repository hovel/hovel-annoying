# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import os
import uuid

from django.conf import settings
from django.utils.deconstruct import deconstructible
from django.utils.encoding import force_text


@deconstructible
class FilePathGenerator(object):
    """
    Special class for generating random filenames with `uuid.uuid4()`.
    Can be deconstructed for correct migration.
    It's useful if:
    - you don't want to allow others to see original names of uploaded files
    - you're afraid that weird unicode names can confuse browsers or filesystem
    """

    def __init__(self, to):
        self.to = to

    def __call__(self, instance, filename):
        extension = os.path.splitext(filename)[1]
        uuid_filename = force_text(uuid.uuid4()) + extension
        upload_path = os.path.join(self.to, uuid_filename[:2])
        if settings.MEDIA_ROOT:
            upload_path_media = os.path.join(settings.MEDIA_ROOT, upload_path)
            if not os.path.exists(upload_path_media):
                os.makedirs(upload_path_media)
                print('\nCreate directory: "{}".\n'.format(upload_path_media))
        return os.path.join(upload_path, uuid_filename)


def get_choice_name(choices, value):
    for choice in choices:
        if choice[0] == value:
            return choice[1]
