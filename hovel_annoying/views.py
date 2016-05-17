# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django import forms
from django.core.exceptions import PermissionDenied, ImproperlyConfigured
from django.http.response import Http404
from django.shortcuts import get_object_or_404
from django.views.generic import View
from django.views.generic.edit import BaseFormView
from django.utils.translation import ugettext as _
from hovel_annoying.json_utils import form_errors_to_dict, \
    NegativeJsonResponse, PositiveJsonResponse


class StatusJsonMixin(object):

    def form_valid(self, form):
        return PositiveJsonResponse(self.format_success_response())

    def format_success_response(self):
        return ''

    def form_invalid(self, form):
        return NegativeJsonResponse(self.format_fail_response(form))

    def format_fail_response(self, form):
        return form_errors_to_dict(form)


class BasePartialDetailView(StatusJsonMixin, BaseFormView):
    """
    Allows to get data from the certain fields of the model via Ajax.
    Usage: client.post('/mymodel/data', {'id': 1, 'fields': ['f1', 'f2']})
    """

    # mandatory
    model = None
    allowed_fields = []

    # do not change
    http_method_names = ['post']
    form_class = forms.Form

    def get_form(self, form_class=None):
        form = super(BasePartialDetailView, self).get_form(form_class)
        form.fields['id'] = forms.IntegerField()
        form.fields['fields'] = forms.MultipleChoiceField(
            choices=[(f, f) for f in self.allowed_fields])
        return form

    def get_object(self, form):
        return get_object_or_404(self.model, id=form.cleaned_data['id'])

    def form_valid(self, form):
        obj = self.get_object(form)

        data = {}
        for field in form.cleaned_data['fields']:
            data[field] = getattr(obj, field)

        return super(BasePartialDetailView, self).form_valid(form)


class BasePartialUpdateView(StatusJsonMixin, View):
    # mandatory
    model = None
    allowed_fields = []
    versioning = False

    # optional
    queryset = None
    pk_url_kwarg = 'pk'
    version_field = 'version'

    # do not change
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        form = self.get_form()
        if form.is_valid():
            return self.form_valid(form)
        else:
            return self.form_invalid(form)

    def get_object(self, queryset=None):
        if queryset is None:
            queryset = self.get_queryset()

        pk = self.kwargs.get(self.pk_url_kwarg, None)
        if pk is not None:
            if self.versioning:
                queryset = queryset.select_for_update().filter(pk=pk)
            else:
                queryset = queryset.filter(pk=pk)
        else:
            raise AttributeError("View {} must be called with either an "
                                 "object pk.".format(self.__class__.__name__))

        try:
            obj = queryset.get()
        except queryset.model.DoesNotExist:
            raise Http404(_("No {} found matching the query")
                          .format(queryset.model._meta.verbose_name))
        return obj

    def get_queryset(self):
        if self.queryset is None:
            if self.model:
                return self.model._default_manager.all()
            else:
                raise ImproperlyConfigured(
                    "{cls} is missing a QuerySet. Define "
                    "{cls}.model, {cls}.queryset, or override "
                    "{cls}.get_queryset().".format(cls=self.__class__.__name__)
                )
        return self.queryset.all()

    def get_form(self):
        self.form_fields = [fld for fld in self.request.POST
                            if fld in self.get_allowed_fields()]
        if not self.form_fields:
            raise PermissionDenied()
        PartialUpdateForm = forms.modelform_factory(self.model,
                                                    fields=self.form_fields)
        return PartialUpdateForm(**self.get_form_kwargs())

    def get_form_kwargs(self):
        kwargs = {
            'data': self.request.POST,
            'instance': self.object
        }
        return kwargs

    def get_allowed_fields(self):
        # protect version of the self.object
        if self.versioning and self.version_field in self.allowed_fields:
            self.allowed_fields.remove(self.version_field)
        return self.allowed_fields

    def form_valid(self, form):
        self.object = form.save(commit=False)
        if self.versioning:
            object_version = getattr(self.object, self.version_field)
            if object_version != int(self.request.POST.get(self.version_field)):
                return self.versioning_error(form)
            else:
                setattr(self.object, self.version_field, object_version + 1)
        self.before_object_save()
        self.object.save()
        self.after_object_save()
        return super(BasePartialUpdateView, self).form_valid(form)

    def before_object_save(self):
        pass

    def after_object_save(self):
        pass

    def format_success_response(self):
        return {fld: getattr(self.object, fld)
                for fld in (self.form_fields if not self.versioning else
                            self.form_fields + [self.version_field])}

    def versioning_error(self, form):
        form.add_error(
            None, 'Объект устарел. Обновите страницу и попробуйте снова.'
        )
        return self.form_invalid(form)
