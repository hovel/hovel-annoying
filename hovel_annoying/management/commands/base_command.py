import logging
import logging.config
from django.core import management

logger = logging.getLogger('management.commands')


class BaseCommand(management.base.BaseCommand):
    def execute(self, *args, **options):
        command_name = self.__module__.split('.')[-1]
        trace_options_exclude = ['settings', 'pythonpath', 'verbosity',
                                 'traceback', 'no_color', 'skip_checks']
        trace_options = {key: value for key, value in options.items()
                         if key not in trace_options_exclude}
        if trace_options:
            trace = '{} {}'.format(command_name, trace_options)
        else:
            trace = '{}'.format(command_name)
        logger.info('Start command {}'.format(trace))
        try:
            super(BaseCommand, self).execute(*args, **options)
        except Exception as e:
            logger.exception('Error in command {}'.format(trace))
            raise
        else:
            logger.info('Finish command {}'.format(trace))
