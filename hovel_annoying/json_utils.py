# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import json
from django.core.serializers.json import DjangoJSONEncoder
from django.http.response import HttpResponse


class StatusJsonResponse(HttpResponse):
    """
    This is extended (but not inherited) version of `JsonResponse` from
    `django.http.response`. Please read its description too.
    If `success` is a boolean, `data` will be dumped with status message
    'success' or 'fail'. Example: `{'status': 'success', 'data': data}`.
    In other cases `data` will be dumped as is.
    `object` was used as default value of `data` to allow dumping of `None`.
    """

    def __init__(self, success=True, data=object, encoder=DjangoJSONEncoder,
                 safe=True, **kwargs):
        if data is object:
            data = {}
        if safe and not isinstance(data, dict):
            raise TypeError('In order to allow non-dict objects to be '
                            'serialized set the safe parameter to False')
        kwargs.setdefault('content_type', 'application/json')
        if isinstance(success, bool):
            data = {
                'status': 'success' if success else 'fail',
                'data': data
            }
        data = json.dumps(data, cls=encoder)
        super(StatusJsonResponse, self).__init__(content=data, **kwargs)


def form_errors_to_dict(form, escape_html=False):
    errors = {}
    for field_name, field_error_list in form.errors.items():
        errors[field_name] = {
            'id': form[field_name].id_for_label,
            'label': form[field_name].label,
            'errors': field_error_list.get_json_data(escape_html)
        }
    return errors
