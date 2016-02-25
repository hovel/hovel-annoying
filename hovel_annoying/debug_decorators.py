# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import time
from functools import wraps
from django.db import connection


def debug_queries(logger, verbose=True):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_queries = len(connection.queries)
            start_time = time.time()
            try:
                return func(*args, **kwargs)
            finally:
                logger.debug('Total time: {}'.format(time.time() - start_time))
                logger.debug('Number of queries: {}'.format(
                    len(connection.queries) - start_queries))
                if verbose:
                    for query in connection.queries[start_queries:]:
                        queries = ['{}: {}'.format(query['time'], query['sql'])]
                        logger.debug(''.join(queries))
        return wrapper
    return decorator
