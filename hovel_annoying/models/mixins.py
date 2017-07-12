# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models


class OldInstanceMixin(models.Model):
    class Meta:
        abstract = True

    @property
    def old_instance(self):
        try:
            if not self.pk:
                raise self.__class__.DoesNotExist()
            return self.__class__.objects.get(pk=self.pk)
        except self.__class__.DoesNotExist:
            return None
