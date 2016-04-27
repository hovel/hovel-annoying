# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf import settings
from django.db import models
from hovel_annoying.model_utils import ChoiceItem, FilePathGenerator


class TempArchiveBase(models.Model):
    """Temporary archive for batch uploading and processing files"""

    STATUS_PENDING = ChoiceItem('pending', 'Ожидает обработки')
    STATUS_PROCESSING = ChoiceItem('processing', 'В процессе обработки')
    STATUS_SUCCESS = ChoiceItem('success', 'Успешно обработан')
    STATUS_ERROR = ChoiceItem('error', 'Ошибка при обработке')
    STATUSES = (STATUS_PENDING, STATUS_PROCESSING, STATUS_SUCCESS, STATUS_ERROR)

    status = models.CharField(verbose_name='статус', max_length=50,
                              choices=STATUSES, default=STATUS_PENDING.value)
    archive = models.FileField(verbose_name='файл архива', blank=True,
                               upload_to=FilePathGenerator(
                                   to='temp_archives/'))
    load_user = models.ForeignKey(settings.AUTH_USER_MODEL,
                                  on_delete=models.CASCADE,
                                  verbose_name='кто загрузил',
                                  blank=True, null=True)
    load_datetime = models.DateTimeField(verbose_name='дата и время загрузки',
                                         blank=True, null=True)

    class Meta:
        abstract = True
        verbose_name = 'временный архив'
        verbose_name_plural = 'временные архивы'
