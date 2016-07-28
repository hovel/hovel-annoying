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
    error_dict = {}
    for field, errors in form.errors.items():
        error_dict[field] = {
            'errors': errors.get_json_data(escape_html)
        }
        if field != NON_FIELD_ERRORS:
            error_dict[field]['id'] = form[field].id_for_label
            error_dict[field]['label'] = form[field].label
    return error_dict


def form_errors_to_string(form):
    error_list = []
    for field, errors in form.errors.items():
        if field != NON_FIELD_ERRORS:
            field_name = '{}: '.format(form[field].label)
        else:
            field_name = ''
        for error in errors:
            error_list.append('{}{}'.format(field_name, error))
    return '\n'.join(error_list)
