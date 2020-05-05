from django.db import models
from django.utils.functional import cached_property


class OldInstanceMixin(models.Model):
    class Meta:
        abstract = True

    @cached_property
    def old_instance(self):
        try:
            if not self.pk:
                raise self.__class__.DoesNotExist()
            return self.__class__.objects.get(pk=self.pk)
        except self.__class__.DoesNotExist:
            return None
