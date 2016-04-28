# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import json
from django.core.exceptions import NON_FIELD_ERRORS
from django.core.serializers.json import DjangoJSONEncoder
from django.http.response import HttpResponse


class StatusJsonResponse(HttpResponse):
    def __init__(self, success=True, data='', encoder=DjangoJSONEncoder,
                 **kwargs):
        content = json.dumps(
            {
                'status': 'success' if success else 'fail',
                'data': data
            },
            cls=encoder
        )
        kwargs.setdefault('content_type', 'application/json')
        super(StatusJsonResponse, self).__init__(content=content, **kwargs)


class PositiveJsonResponse(StatusJsonResponse):
    def __init__(self, data='', encoder=DjangoJSONEncoder, **kwargs):
        super(PositiveJsonResponse, self).__init__(
            success=True, data=data, encoder=encoder, **kwargs)


class NegativeJsonResponse(StatusJsonResponse):
    def __init__(self, data='', encoder=DjangoJSONEncoder, **kwargs):
        super(NegativeJsonResponse, self).__init__(
            success=False, data=data, encoder=encoder, **kwargs)


def form_errors_to_dict(form, escape_html=False):
    errors = {}
    for field_name, field_error_list in form.errors.items():
        errors[field_name] = {
            'errors': field_error_list.get_json_data(escape_html)
        }
        if field_name != NON_FIELD_ERRORS:
            errors[field_name]['id'] = form[field_name].id_for_label
            errors[field_name]['label'] = form[field_name].label
    return errors
