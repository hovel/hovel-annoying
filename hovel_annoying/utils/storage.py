# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import os
import tempfile

import boto3
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils.six import text_type
from django.utils.six.moves.urllib.parse import quote
from storages.backends.s3boto3 import S3Boto3Storage
from storages.utils import safe_join


def get_s3_client(storage=None):
    if isinstance(storage, S3Boto3Storage):
        client = storage.connection.meta.client
        return client

    client = boto3.client(
        service_name='s3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
    return client


def is_aws_s3(storage):
    result = isinstance(storage, S3Boto3Storage)
    return result


def get_s3_provider(storage):
    if isinstance(storage, S3Boto3Storage):
        s3_provider = 'aws'
    else:
        s3_provider = ''
    return s3_provider


def get_bucket_name(field_file):
    if isinstance(field_file.storage, S3Boto3Storage):
        bucket_name = field_file.file.obj.bucket_name
    else:
        bucket_name = ''
    return bucket_name


def get_key_name(field_file):
    if isinstance(field_file.storage, S3Boto3Storage):
        key_name = field_file.file.obj.key
    else:
        key_name = ''
    return key_name


def get_file(field_file, tmp_file):
    if isinstance(field_file.storage, FileSystemStorage):
        local_file = field_file.path
    elif is_aws_s3(field_file.storage):
        s3 = get_s3_client(field_file.storage)
        bucket_name = get_bucket_name(field_file)
        key_name = get_key_name(field_file)
        s3.download_file(Bucket=bucket_name, Key=key_name, Filename=tmp_file)
        local_file = tmp_file
    else:
        raise NotImplementedError()
    return local_file


def get_content_disposition(filename):
    if isinstance(filename, text_type):
        filename = filename.encode('utf8')
    quoted = quote(filename)
    cd = '''attachment; filename="{0}"; filename*=UTF-8''{0}'''.format(quoted)
    return cd


def get_signed_url(field_file, filename=None):
    # TODO expiration time

    if not field_file:
        return ''

    if not is_aws_s3(field_file.storage):
        return field_file.url

    # проверка возможности получения файла из хранилища
    # получение контента здесь не происходит, см. FieldFile.file
    try:
        _ = field_file.file
    except IOError as e:
        return ''

    client = get_s3_client(field_file.storage)
    bucket_name = get_bucket_name(field_file)
    key_name = get_key_name(field_file)
    cd = get_content_disposition(filename or os.path.basename(field_file.name))
    url = client.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': bucket_name,
            'Key': key_name,
            'ResponseContentDisposition': cd})
    return url


def sync(src_storage, src_path, dest_storage, dest_path):
    if is_aws_s3(src_storage) and is_aws_s3(dest_storage):
        src_key = safe_join(src_storage.location, src_path)
        dest_key = safe_join(dest_storage.location, dest_path)
        src_s3_client = get_s3_client(src_storage)
        if src_storage.access_key == dest_storage.access_key:
            src_s3_client.copy(
                {'Bucket': src_storage.bucket_name, 'Key': src_key},
                dest_storage.bucket_name, dest_key)
        else:
            _, tmp_file_path = tempfile.mkstemp()
            try:
                src_s3_client.download_file(
                    Bucket=src_storage.bucket_name, Key=src_key,
                    Filename=tmp_file_path)
                dest_s3_client = get_s3_client(dest_storage)
                dest_s3_client.upload_file(
                    Filename=tmp_file_path, Bucket=dest_storage.bucket_name,
                    Key=dest_key)
            except Exception:
                raise
            finally:
                os.remove(tmp_file_path)
    else:
        # копирование таким способом безопасно даже если файл копируется
        # "сам в себя" (т.е. на тот же накопитель и с тем же путём и
        # именем), в этом случае внутренние механизмы копирования его не
        # трогают, а просто возвращают положительный результат
        opened = src_storage.open(src_path)
        dest_storage.save(dest_path, opened)
        opened.close()
