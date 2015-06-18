;
/**
 * @require {@link SimpleAJAXRequest}
 */


var plainContentEditableDefaults = {
    getField: function ($edited) {
        return $edited.data('contenteditable-field');
    },
    getURL: function ($edited) {
        return $edited.data('contenteditable-url');
    },
    extendData: function (data, $edited) {
        return data;
    },
    onFocus: function ($focused, config) {
        $focused.data('contenteditable-original', $.trim($focused.text()));
        $focused.on('keydown', function (e) {
            var $edited = $(this);
            if (e.which == 13 || e.which == 27) {
                e.preventDefault();
                if (e.which == 27) {
                    $edited.text($edited.data('contenteditable-original'));
                }
                $edited.trigger('blur');
            }
        });
    },
    onBlur: function ($blurred, config) {
        $blurred.off('keydown');
        var newValue = $.trim($blurred.text()),
            originalValue = $blurred.data('contenteditable-original');

        if (newValue == originalValue) {
            return;
        }

        var fieldName = config.getField($blurred),
            data = {};
        data[fieldName] = newValue;

        SimpleAJAXRequest({
            url: config.getURL($blurred),
            data: config.extendData(data, $blurred),
            onSuccess: function (data) {
                $blurred.text(data[fieldName]);
                if (typeof config.onSuccess == 'function') {
                    config.onSuccess(data, $blurred);
                }
            },
            onFail: function (data) {
                $blurred.text(originalValue);
                var message = 'Что-то пошло не так. Попробуйте обновить страницу.';
                if (typeof data == 'string') {
                    message = data || message;
                } else if (typeof data == 'object') {
                    try {
                        message = data.__all__.errors[0].message || message;
                    } catch (ex) {}
                }
                alert(message);
            },
            onError: function () {
                $blurred.text(originalValue);
                alert('Что-то пошло не так. Попробуйте обновить страницу.');
            }
        })
    }
};


/**
 * Usage: see descriptions of the options; add <code>contenteditable="true"</code> before initializing
 * @param {Object} options
 * @param {String} options.selector - CSS selector
 * @param {Function} [options.getField] - takes edited element and returns field to update;
 *                                        value of data-contenteditable-field attribute will be used by default
 * @param {Function} [options.getURL] - takes edited element and returns url to request;
 *                                      value of data-contenteditable-url attribute will be used by default
 * @param {Function} [options.extendData] - takes initial data and edited element, allows to send
 *                                          additional data like version, etc.
 * @param {Function} [options.onSuccess] - see {@link SimpleAJAXRequest} for calling conditions;
 *                                         takes response.data and edited element
 */
function initPlainContentEditable(options) {
    var config = $.extend({}, plainContentEditableDefaults, options);

    $(config.selector).each(function () {
        var $target = $(this);
        $target.on('focus', function () {
            config.onFocus($target, config);
        });
        $target.on('blur', function () {
            config.onBlur($target, config);
        });
    });
}


var plainContentEditableWithActivatorDefaults = $.extend({}, plainContentEditableDefaults, {
    getTarget: function ($activator) {
        return $('[data-contenteditable=' + $activator.data('contenteditable-target') + ']');
    },
    toggleParentLink: function ($parentLink) {
        if ($parentLink.length == 1) {
            if ($parentLink.get(0).hasAttribute('href')) {
                $parentLink.data('href', $parentLink.attr('href'));
                $parentLink.removeAttr('href');
            } else {
                $parentLink.attr('href', $parentLink.data('href'));
            }
        }
    }
});


/**
 * Usage: see descriptions of the options; <code>contenteditable="true"</code> will be added and removed automatically
 * @param {Object} options
 * @param {String} options.activatorSelector - CSS selector
 * @param {Function} [options.getTarget] - takes clicked element (activator), returns target to edit;
 *                                         by default returns element with attribute <code>data-contenteditable="%id%"</code>,
 *                                         where <code>%id%</code> is equals to <code>data-contenteditable-target="%id%"</code>
 *                                         of $activator; <code>%id%</code> means any string or number, not a real id
 * @param {Function} [options.getField] - see {@link initPlainContentEditable}
 * @param {Function} [options.getURL] - see {@link initPlainContentEditable}
 * @param {Function} [options.extendData] - see {@link initPlainContentEditable}
 * @param {Function} [options.onSuccess] - see {@link initPlainContentEditable}
 */
function initPlainContentEditableWithActivator(options) {
    var config = $.extend({}, plainContentEditableWithActivatorDefaults, options);

    $(config.activatorSelector).each(function () {
        var $activator = $(this);
        $activator.on('click', function (e) {
            e.preventDefault();
            var $target = config.getTarget($activator),
                $parentLink = $target.closest('a');
            config.toggleParentLink($parentLink);
            $target.attr({contenteditable: 'true'});
            $target.on('focus', function () {
                config.onFocus($target, config);
            });
            $target.on('blur', function () {
                config.onBlur($target, config);
                $target.off('focus blur');
                $target.removeAttr('contenteditable');
                config.toggleParentLink($parentLink);
            });
            $target.trigger('focus');
        })
    });
}
