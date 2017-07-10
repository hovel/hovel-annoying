# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import hashlib

from django.conf import settings
from django.db import models
from django.utils.formats import localize

from hovel_annoying.model_utils import FilePathGenerator


class TempArchiveBaseQuerySet(models.QuerySet):
    def not_cleaned(self):
        return self.filter(clean_datetime__isnull=True)


class TempArchiveBase(models.Model):
    """Temporary archive for batch uploading and processing files"""

    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_SUCCESS = 'success'
    STATUS_ERROR = 'error'
    STATUSES = ((STATUS_PENDING, 'Ожидает обработки'),
                (STATUS_PROCESSING, 'В процессе обработки'),
                (STATUS_SUCCESS, 'Успешно обработан'),
                (STATUS_ERROR, 'Ошибка при обработке'))

    status = models.CharField(verbose_name='статус', max_length=50,
                              choices=STATUSES, default=STATUS_PENDING)
    status_verbose = models.TextField(verbose_name='подробный статус',
                                      blank=True)
    archive = models.FileField(verbose_name='файл архива', blank=True,
                               upload_to=FilePathGenerator(
                                   to='temp_archives/'))
    load_user = models.ForeignKey(settings.AUTH_USER_MODEL,
                                  on_delete=models.SET_NULL,
                                  verbose_name='кто загрузил',
                                  blank=True, null=True)
    load_datetime = models.DateTimeField(verbose_name='дата и время загрузки',
                                         blank=True, null=True)
    clean_datetime = models.DateTimeField(verbose_name='дата и время очистки',
                                          blank=True, null=True)
    size = models.BigIntegerField(verbose_name='размер', blank=True, null=True)
    hash = models.CharField(verbose_name='хэш', max_length=128, blank=True)

    objects = TempArchiveBaseQuerySet.as_manager()

    class Meta:
        abstract = True
        verbose_name = 'временный архив'
        verbose_name_plural = 'временные архивы'

    def get_size(self, strict=False):
        if self.archive and (strict or not self.size):
            try:
                size = self.archive.file.size
                if size != self.size:
                    self.size = size
                    self.save()
            except IOError:
                return 0
        return self.size

    def get_hash(self, strict=False):
        if self.archive and (strict or not self.hash):
            try:
                hash = hashlib.md5()
                for chunk in self.archive.chunks(chunk_size=8192):
                    hash.update(chunk)
                hexdigest = hash.hexdigest()
                if hexdigest != self.hash:
                    self.hash = hexdigest
                    self.save()
            except IOError:
                return ''
        return self.hash

    def get_siblings(self):
        # Somethings like `self.related_object.temp_archives.all()`
        return NotImplemented

    def get_older_siblings(self):
        return self.get_siblings() \
            .filter(load_datetime__lte=self.load_datetime) \
            .exclude(pk__gte=self.pk)

    def was_loaded_before(self, update_status=False):
        for old in self.get_older_siblings():
            if old.get_size() == self.get_size() and \
                    old.get_hash() == self.get_hash():
                if update_status:
                    self.status = self.STATUS_ERROR
                    self.status_verbose = \
                        'Архив загружен повторно. Предыдущая загрузка была {}.' \
                        ''.format(localize(old.load_datetime))
                    self.save()
                return True
        return False
