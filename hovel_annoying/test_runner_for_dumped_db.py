# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.conf import settings
from django.db.backends.base.creation import BaseDatabaseCreation
from django.test.runner import DiscoverRunner
import subprocess


# This code allows to use initial database dump to skip migrations.
# How to use:
# - create empty database and apply migrations you want to fake (skip) when tests will be started
# - save the dump
# - add ``'DUMP': 'path_to_the_dump.sql'`` into the ``TEST`` section of the DB config
#   (see https://docs.djangoproject.com/en/1.8/ref/settings/#test)
# - set the test runner: ``TEST_RUNNER = 'hovel_annoying.test_runner_for_dumped_db.Runner'``
#   (see https://docs.djangoproject.com/en/1.8/ref/settings/#test-runner)


class Runner(DiscoverRunner):
    pass


def create_test_db(self, verbosity=1, autoclobber=False, serialize=True, keepdb=False):
        """
        Creates a test database, prompting the user for confirmation if the
        database already exists. Returns the name of the test database created.
        """
        # Don't import django.core.management if it isn't needed.
        from django.core.management import call_command

        test_database_name = self._get_test_db_name()

        if verbosity >= 1:
            action = 'Creating'
            if keepdb:
                action = "Using existing"

            print("%s test database for alias %s..." % (
                action,
                self._get_database_display_str(verbosity, test_database_name),
            ))

        # We could skip this call if keepdb is True, but we instead
        # give it the keepdb param. This is to handle the case
        # where the test DB doesn't exist, in which case we need to
        # create it, then just not destroy it. If we instead skip
        # this, we will get an exception.
        self._create_test_db(verbosity, autoclobber, keepdb)

        self.connection.close()
        settings.DATABASES[self.connection.alias]["NAME"] = test_database_name
        self.connection.settings_dict["NAME"] = test_database_name

        # ---------------------- SPECIAL FUNCTIONALITY ---------------------- #

        # Load sql dump
        if not keepdb:
            keepdb = True
            cmd = ['mysql', '-u', self.connection.settings_dict['USER']]
            if self.connection.settings_dict['PASSWORD']:
                cmd.append('-p' + self.connection.settings_dict['PASSWORD'])
            if self.connection.settings_dict['HOST']:
                cmd.append('-h')
                cmd.append(self.connection.settings_dict['HOST'])
            cmd.append(test_database_name)
            with open(self.connection.settings_dict['TEST']['DUMP'], 'r') as dump:
                subprocess.call(cmd, stdin=dump)

        # ------------------------------------------------------------------- #

        # We report migrate messages at one level lower than that requested.
        # This ensures we don't get flooded with messages during testing
        # (unless you really ask to be flooded).
        call_command(
            'migrate',
            verbosity=max(verbosity - 1, 0),
            interactive=False,
            database=self.connection.alias,
            run_syncdb=True,
        )

        # We then serialize the current state of the database into a string
        # and store it on the connection. This slightly horrific process is so people
        # who are testing on databases without transactions or who are using
        # a TransactionTestCase still get a clean database on every test run.
        if serialize:
            self.connection._test_serialized_contents = self.serialize_db_to_string()

        call_command('createcachetable', database=self.connection.alias)

        # Ensure a connection for the side effect of initializing the test database.
        self.connection.ensure_connection()

        return test_database_name


BaseDatabaseCreation.create_test_db = create_test_db
