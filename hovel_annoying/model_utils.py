import os
import uuid

from django.utils.deconstruct import deconstructible
from django.utils.encoding import force_str


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
        uuid_filename = force_str(uuid.uuid4()) + extension
        return os.path.join(
            self.to, uuid_filename[:2], uuid_filename[2:4], uuid_filename)


def get_choice_name(choices, value):
    for choice in choices:
        if choice[0] == value:
            return choice[1]
