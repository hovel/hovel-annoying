# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import calendar
from datetime import date
from django.utils import timezone
from django.utils.safestring import mark_safe

calendar.day_abbr = [
    da.encode('utf-8') for da in ('Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс')
]


class WebCalendar(calendar.LocaleHTMLCalendar):
    dataset_name = 'date'
    dataset_format = '%Y-%m-%d'
    mark_classname = 'marked'
    align_height_of_months = True  # by adding empty rows

    def __init__(self, marked_days=None, firstweekday=calendar.MONDAY,
                 locale=b'ru_RU.UTF-8'):
        self.marked_days = marked_days
        super(WebCalendar, self).__init__(firstweekday, locale)

    def web_formatday(self, day, weekday, themonth, theyear):
        """
        Return a day as a table cell.
        """
        if day == 0:
            return '<td class="noday">&nbsp;</td>'  # day outside month
        else:
            day_class = self.cssclasses[weekday]
            day_date = date(theyear, themonth, day)
            if self.marked_days is not None and day_date in self.marked_days:
                day_class = '{} {}'.format(day_class, self.mark_classname)
            dataset = day_date.strftime(self.dataset_format)
            return '<td class="{}" data-{}="{}">{}</td>'.format(
                day_class, self.dataset_name, dataset, day
            )

    def web_formatweek(self, theweek, themonth, theyear):
        """
        Return a complete week as a table row.
        """
        s = ''.join(
            self.web_formatday(d, wd, themonth, theyear) for (d, wd) in theweek
        )
        return '<tr>%s</tr>' % s

    def web_formatmonth(self, theyear, themonth, withyear=True):
        """
        Return a formatted month as a table.
        """
        weeks = self.monthdays2calendar(theyear, themonth)
        if self.align_height_of_months:
            for i in range(len(weeks), 6):
                weeks.append([(0, weekday) for weekday in range(1, 8)])
        v = []
        a = v.append
        a('<table border="0" cellpadding="0" cellspacing="0" class="month">')
        a('\n')
        a(self.formatmonthname(theyear, themonth, withyear=withyear))
        a('\n')
        a(self.formatweekheader())
        a('\n')
        for week in weeks:
            a(self.web_formatweek(week, themonth, theyear))
            a('\n')
        a('</table>')
        a('\n')
        return ''.join(v)

    def web_formatmonth_list(self, months_range=12, withyear=True):
        result = []
        present = timezone.now()
        year = present.year
        month = present.month
        for i in range(months_range):
            result.append(
                mark_safe(
                    self.web_formatmonth(year, month, withyear=withyear)
                )
            )
            month += 1
            if month > 12:
                year += 1
                month -= 12
        return result
