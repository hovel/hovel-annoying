# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import logging
import os
import shutil
import tempfile

from django.utils import timezone

from hovel_annoying.models import TempArchiveBase


class ProcessTempArchiveBase(object):
    model = NotImplemented
    logger_name = None

    def __init__(self):
        super(ProcessTempArchiveBase, self).__init__()
        assert issubclass(self.model, TempArchiveBase)
        logger_name = self.logger_name or __name__
        self.logger = logging.getLogger(logger_name)

    def run(self, instance_id):
        self.descr = '{} {}'.format(self.model.__name__, instance_id)

        self.logger.info('Start processing of {}.'.format(self.descr))

        locked = self.model.objects \
            .filter(id=instance_id, status=self.model.STATUS_PENDING) \
            .update(status=self.model.STATUS_PROCESSING)
        if not locked:
            self.logger.error('{} not found or already locked or processed.'
                              ''.format(self.descr))
            return

        self.instance = self.model.objects.get(id=instance_id)
        if not self.instance.load_datetime:
            self.instance.load_datetime = timezone.now()
            self.instance.save()

        if self.instance.was_loaded_before(update_status=True):
            return

        _, self.tmp_file = tempfile.mkstemp()
        self.tmp_dir = tempfile.mkdtemp()
        try:
            self.process()
        except Exception as e:
            msg = 'Error occurred during processing of {}: {}' \
                  ''.format(self.descr, e)
            output = getattr(e, 'output', None)
            if output:
                msg = '{}\n{}'.format(msg, output.decode('utf8'))
            self.logger.exception(msg)
            raise
        finally:
            os.remove(self.tmp_file)
            shutil.rmtree(self.tmp_dir)

        self.logger.info('Finish processing of {}.'.format(self.descr))

    def process(self):
        return NotImplemented
