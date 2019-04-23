# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import os
import shutil
import subprocess

from django.utils.six import text_type


def check_extracted_archive(archive_path, target_directory):
    number_of_extracted_files = 0
    for dirpath, dirnames, filenames in os.walk(target_directory):
        number_of_extracted_files += len(filenames)

    number_of_archived_files = None
    commands = [(['unzip', '-l', archive_path], 5),
                (['lsar', archive_path], 1)]
    for command, correction in commands:
        try:
            out = subprocess.check_output(command)
            lines = [l for l in out.splitlines() if not l.endswith(os.sep)]
            number_of_archived_files = len(lines) - correction
        except subprocess.CalledProcessError as e:
            continue

    if number_of_archived_files == number_of_extracted_files:
        return True
    return False


def extract_archive(archive_path, target_directory):
    commands = [['unzip', '-o', '-d', target_directory, archive_path],
                ['unar', '-f', '-o', target_directory, archive_path]]
    for command in commands:
        try:
            _ = subprocess.check_output(command)
            return True
        except subprocess.CalledProcessError as e:
            if check_extracted_archive(archive_path, target_directory):
                return True
            for name in os.listdir(target_directory):
                subpath = os.path.join(target_directory, name)
                if os.path.isdir(subpath):
                    shutil.rmtree(subpath)
                else:
                    os.remove(subpath)
            continue
    return False


def decode_zip_path(path):
    """Decode name of file or directory extracted from zip archive"""

    if isinstance(path, text_type):
        return path
    try:
        return path.decode('utf8')
    except UnicodeError:
        try:
            return path.decode('cp1252').encode('cp850').decode('cp866')
        except UnicodeError:
            return path.decode('cp866')
