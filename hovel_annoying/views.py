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
        field = request.POST.get('field')
        if field not in self.fields:
            raise PermissionDenied()
        PartialUpdateForm = modelform_factory(self.model, fields=[field])
        form = PartialUpdateForm(
            data={field: request.POST.get('value')}, instance=self.object
        )
        if form.is_valid():
            form.save()
            return StatusJsonResponse(True, {field: form.cleaned_data[field]})
        else:
            return StatusJsonResponse(False)
