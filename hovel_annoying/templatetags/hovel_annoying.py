import operator
from django import template

register = template.Library()


@register.simple_tag(takes_context=True)
def highlight_menu(context, url):
    return ' active ' if context['request'].get_full_path() == url else ' '


@register.filter
def format_price(price):
    return '{0:,}'.format(int(price)).replace(',', ' ')


@register.filter
def sort_by_field(iterable, field='id'):
    if not iterable:
        return iterable

    return sorted(iterable, key=operator.attrgetter(field.lstrip('-')),
                  reverse=field.startswith('-'))
