# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django import template

register = template.Library()


@register.simple_tag(takes_context=True)
def highlight_menu(context, url):
    return ' active ' if context['request'].get_full_path() == url else ' '


@register.filter
def format_price(price):
    return '{0:,}'.format(int(price)).replace(',', ' ')
