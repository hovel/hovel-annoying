# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.core.exceptions import PermissionDenied
from django.forms.models import modelform_factory
from django.views.generic import View
from django.views.generic.detail import SingleObjectMixin
from hovel_annoying.json_utils import StatusJsonResponse


class BasePartialUpdateView(SingleObjectMixin, View):
    http_method_names = ['post']
    fields = []

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.field = request.POST.get('field')
        if self.field not in self.fields:
            raise PermissionDenied()
        PartialUpdateForm = modelform_factory(self.model, fields=[self.field])
        raw_value = self.filter_raw_value(request.POST.get('value'))
        form = PartialUpdateForm(
            data={self.field: raw_value}, instance=self.object
        )
        if form.is_valid():
            form.save()
            saved_value = self.filter_saved_value(
                form.cleaned_data[self.field]
            )
            return StatusJsonResponse(True, {self.field: saved_value})
        else:
            return StatusJsonResponse(False)

    def filter_raw_value(self, value):
        return value

    def filter_saved_value(self, value):
        return value
