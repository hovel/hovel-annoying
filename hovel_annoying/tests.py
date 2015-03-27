# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import json
from django import forms
from django.test import TestCase
from django.test.utils import override_settings
from hovel_annoying.json_utils import StatusJsonResponse, form_errors_to_dict


class TestJsonUtils(TestCase):
    def test_status_json_response(self):
        data = {1: 'test'}

        success = StatusJsonResponse(True, data)
        self.assertEqual(success.status_code, 200)
        self.assertEqual(
            json.loads(success.content),
            {'status': 'success', 'data': {'1': 'test'}}
        )

        fail = StatusJsonResponse(False, data)
        self.assertEqual(fail.status_code, 200)
        self.assertEqual(
            json.loads(fail.content),
            {'status': 'fail', 'data': {'1': 'test'}}
        )

        without_status = StatusJsonResponse(None, data)
        self.assertEqual(without_status.status_code, 200)
        self.assertEqual(
            json.loads(without_status.content),
            {'1': 'test'}
        )

        data_only = StatusJsonResponse(data=data)
        self.assertEqual(data_only.status_code, 200)
        self.assertEqual(
            json.loads(data_only.content),
            {'status': 'success', 'data': {'1': 'test'}}
        )

        empty = StatusJsonResponse()
        self.assertEqual(empty.status_code, 200)
        self.assertEqual(
            json.loads(empty.content),
            {'status': 'success', 'data': {}}
        )

    @override_settings(LANGUAGE_CODE='en')
    def test_form_errors_to_dict(self):
        class TestForm(forms.Form):
            char = forms.CharField()
            integer = forms.IntegerField()

        test_form = TestForm({}, prefix='test')
        errors = form_errors_to_dict(test_form)

        errors_sample = {
            'char': {
                'id': 'id_test-char',
                'label': 'Char',
                'errors': [
                    {'message': 'This field is required.', 'code': 'required'}
                ]
            },
            'integer': {
                'id': 'id_test-integer',
                'label': 'Integer',
                'errors': [
                    {'message': 'This field is required.', 'code': 'required'}
                ]
            }
        }

        self.assertEqual(errors, errors_sample)
