# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.core.exceptions import PermissionDenied
from django.forms.models import modelform_factory
from django.views import generic
from django.shortcuts import get_object_or_404
from hovel_annoying.json_utils import StatusJsonResponse


class PartialUpdateMixin(generic.View):
    http_method_names = ['post']
    model = None
    fields = []

    def post(self, request, pk):
        obj = get_object_or_404(self.model, pk=pk)
        field = request.POST.get('field')
        if field not in self.fields:
            raise PermissionDenied()
        PartialUpdateForm = modelform_factory(self.model, fields=[field])
        form = PartialUpdateForm(
            data={field: request.POST.get('value')}, instance=obj
        )
        if form.is_valid():
            form.save()
            return StatusJsonResponse(True, {field: form.cleaned_data[field]})
        else:
            return StatusJsonResponse(False)
