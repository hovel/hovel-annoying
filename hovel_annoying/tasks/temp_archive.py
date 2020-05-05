import logging
import os
import shutil
import tempfile

from django.utils import timezone

from hovel_annoying.utils.archive import extract_archive, decode_zip_path
from hovel_annoying.utils.storage import get_file


class ProcessTempArchiveBase(object):
    model = NotImplemented
    logger_name = None

    def __init__(self):
        super(ProcessTempArchiveBase, self).__init__()
        logger_name = self.logger_name or __name__
        self.logger = logging.getLogger(logger_name)

    def run(self, instance_id):
        self.descr = self.format_descr(instance_id)
        self.logger.info('Start processing of {}'.format(self.descr))
        self.temp_paths = []
        try:
            self.instance = self.lock_instance(instance_id)
            if self.instance is None:
                return

            if not self.check_instance():
                return

            archive_path = self.get_archive()
            self.tmp_dir = self.extract_archive(archive_path)
            if self.tmp_dir is None:
                return

            self.save_content_list()

            self.process_extracted()
        except Exception as e:
            self.logger.exception('Cannot process {}'.format(self.descr))
            try:
                self.instance.status = self.model.STATUS_ERROR
                self.instance.save()
            except Exception as ee:
                pass
            raise e
        finally:
            self.cleanup()
            self.logger.info('Finish processing of {}.'.format(self.descr))

    def format_descr(self, instance_id):
        descr = '{} {}'.format(self.model._meta.label, instance_id)
        return descr

    def lock_instance(self, instance_id):
        lock = self.model.objects \
            .filter(id=instance_id, status=self.model.STATUS_PENDING) \
            .update(status=self.model.STATUS_PROCESSING,
                    lock_datetime=timezone.now())
        if lock == 1:
            instance = self.model.objects.get(id=instance_id)
            return instance
        else:
            self.logger.error('Cannot lock {}'.format(self.descr))
            return None

    def check_instance(self):
        return True

    def get_archive(self):
        _, archive_path = tempfile.mkstemp()
        self.temp_paths.append(archive_path)
        archive_path = get_file(self.instance.archive, archive_path)
        return archive_path

    def extract_archive(self, archive_path):
        target_directory = tempfile.mkdtemp()
        self.temp_paths.append(target_directory)
        if extract_archive(archive_path, target_directory):
            return target_directory
        else:
            self.instance.status = self.model.STATUS_ERROR
            self.instance.save()
            self.logger.error('Cannot extract {}'.format(self.descr))
            return None

    def save_content_list(self):
        content_list = []
        for dirpath, dirnames, filenames in os.walk(self.tmp_dir):
            for filename in filenames:
                path = os.path.join(dirpath, filename)
                decoded = decode_zip_path(path)
                relpath = os.path.relpath(decoded, self.tmp_dir)
                content_list.append(relpath)
        self.instance.content_list = '\n'.join(content_list)
        self.instance.save()

    def process_extracted(self):
        raise NotImplementedError()

    def cleanup(self):
        for temp_path in self.temp_paths:
            if os.path.isdir(temp_path):
                shutil.rmtree(temp_path)
            else:
                os.remove(temp_path)
