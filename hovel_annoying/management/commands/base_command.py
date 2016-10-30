# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import sys
import logging
import logging.config
from django.core import management

logger = logging.getLogger('management.commands')


class BaseCommand(management.base.BaseCommand):
    def execute(self, *args, **options):
        cli_args = ' '.join(sys.argv)
        logger.info('Start command {}'.format(cli_args))
        try:
            super(BaseCommand, self).execute(*args, **options)
        except Exception as e:
            logger.exception('Error in command {}'.format(cli_args))
            raise
        else:
            logger.info('Finish command {}'.format(cli_args))
