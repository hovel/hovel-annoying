;
/**
 * @typedef {Object} jQuery
 */


/**
 * @param {Object} options
 * @param {String} options.url
 * @param {(jQuery|String|Array)} [options.data] - data to send
 * @param {Function} [options.onSuccess] - called if connection was successful
 *                                         and server returned status 'success',
 *                                         takes response.data as argument
 * @param {Function} [options.onFail] - called if connection was successful
 *                                      but server returned status 'fail',
 *                                      takes response.data as argument
 * @param {Function} [options.onError] - called if connection was unsuccessful
 */
function SimpleAJAXRequest(options) {
    $.ajax({
        url: options.url,
        data: options.data || '',
        dataType: 'json',
        method: 'POST',
        success: function (response, textStatus, jqXHR) {
            if (response.status == 'success') {
                if (typeof options.onSuccess == 'function') {
                    options.onSuccess(response.data);
                }
            } else if (response.status == 'fail') {
                if (typeof options.onFail == 'function') {
                    options.onFail(response.data);
                } else if (typeof response.data == 'string') {
                    alert(response.data);
                } else {
                    alert('Что-то пошло не так. Попробуйте обновить страницу.');
                }
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (typeof options.onError == 'function') {
                options.onError();
            } else {
                alert('Что-то пошло не так. Попробуйте обновить страницу.');
            }
        }
    });
}


/**
 * @param {String|Object} data
 * @param {jQuery} $form
 * @param {String} errorMsgClass
 */
function displayFormErrors(data, $form, errorMsgClass) {
    function displayError($element, message) {
        $element.after('<small class="' + errorMsgClass.replace(/\./g, ' ') + '">' + message + '</small>');
    }

    if (typeof data == 'string') {
        displayError($form.find('.form-group').last(), data);
    } else {
        for (var fieldName in data) {
            if (data.hasOwnProperty(fieldName)) {
                var message = data[fieldName].errors[0].message;
                if (fieldName == '__all__') {
                    displayError($form.find('.form-group').last(), message);
                } else {
                    displayError($form.find('#' + data[fieldName].id), message);
                }
            }
        }
    }
}


/**
 * @param {Object} options
 * @param {jQuery} options.$form - form inside $modal
 * @param {Function} [options.onSuccess] - see {@link SimpleAJAXRequest}
 * @param {Function} [options.onFail] - see {@link SimpleAJAXRequest} for calling
 *                                      conditions; takes request.data, $form,
 *                                      and error message class as arguments;
 *                                      default value is {@link displayFormErrors}
 * @param {Function} [options.onError] - see {@link SimpleAJAXRequest}
 */
function initSimpleForm(options) {
    var $form = options.$form,
        errorMsgClass = '.simple-form-error.text-danger';

    $form.on('submit', function (e) {
        e.preventDefault();
        $form.find(errorMsgClass).remove();
        SimpleAJAXRequest({
            url: $form.attr('action'),
            data: $form.serialize(),
            onSuccess: options.onSuccess,
            onFail: function (data) {
                (options.onFail || displayFormErrors)(data, $form, errorMsgClass);
            },
            onError: options.onError
        });
    });
}


/**
 * @param {Object} options
 * @param {jQuery} options.$modal - modal window
 * @param {jQuery} options.$form - form inside $modal
 * @param {Function} [options.onSuccess] - see {@link SimpleAJAXRequest}
 * @param {Function} [options.onFail] - see {@link SimpleAJAXRequest} for calling
 *                                      conditions; takes request.data, $form,
 *                                      and error message class as arguments;
 *                                      default value is {@link displayFormErrors}
 * @param {Function} [options.onError] - see {@link SimpleAJAXRequest}
 */
function initSimpleModalForm(options) {
    var $modal = options.$modal,
        $form = options.$form,
        errorMsgClass = '.simple-modal-form-error.text-danger';

    $modal.on('hidden.bs.modal', function () {
        $form.trigger('reset');
        $form.find(errorMsgClass).remove();
    });
    $form.on('submit', function (e) {
        e.preventDefault();
        $form.find(errorMsgClass).remove();
        SimpleAJAXRequest({
            url: $form.attr('action'),
            data: $form.serialize(),
            onSuccess: function (data) {
                if (typeof options.onSuccess == 'function') {
                    options.onSuccess(data);
                    $modal.data('bs.modal').handleUpdate();
                }
            },
            onFail: function (data) {
                (options.onFail || displayFormErrors)(data, $form, errorMsgClass);
                $modal.data('bs.modal').handleUpdate();
            },
            onError: function () {
                if (typeof options.onError == 'function') {
                    options.onError();
                    $modal.data('bs.modal').handleUpdate();
                }
            }
        });
    });
}


function toggleContentEditableParentLink($parentLink) {
    if ($parentLink.length == 1) {
        if ($parentLink.get(0).hasAttribute('href')) {
            $parentLink.data('href', $parentLink.attr('href'));
            $parentLink.removeAttr('href');
        } else {
            $parentLink.attr('href', $parentLink.data('href'));
        }
    }
}


function initPlainContentEditableOnFocus($focused, field) {
    $focused.data('original-' + field, $.trim($focused.text()));
    $focused.on('keydown', function (e) {
        var $edited = $(this);
        if (e.which == 13 || e.which == 27) {
            if (e.which == 27) {
                $edited.text($edited.data('original-' + field));
            }
            $edited.trigger('blur');
        }
    });
}


function initPlainContentEditableOnBlur($blurred, field, urlBuilder, onSuccess) {
    $blurred.off('keydown');
    var newValue = $.trim($blurred.text()),
        originalValue = $blurred.data('original-' + field),
        url;

    if (newValue != originalValue) {
        if (typeof urlBuilder == 'function') {
            url = urlBuilder($blurred);
        } else {
            url = $blurred.data('contenteditable-url');
        }

        $.ajax({
            url: url,
            data: {'field': field, 'value': newValue},
            dataType: 'json',
            method: 'POST',
            success: function (response, textStatus, jqXHR) {
                if (response.status == 'success') {
                    $blurred.text(response.data[field]);
                    if (typeof onSuccess == 'function') {
                        onSuccess(response.data, $blurred);
                    }
                } else if (response.status == 'fail') {
                    $blurred.text(originalValue);
                    alert('Что-то пошло не так. Попробуйте обновить страницу.');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $blurred.text(originalValue);
                alert('Что-то пошло не так. Попробуйте обновить страницу.');
            }
        });
    }
}


/**
 * Usage: just add <code>contenteditable="true"</code> attribute to the element you want to be edited and initialize this function.
 * @param {Object} options
 * @param {String} options.selector - CSS selector
 * @param {String} options.field - name of the field to update
 * @param {Function} [options.urlBuilder] - function that takes the edited jQuery element and returns url to request;
 *                                          if undefined, value will be taken from data-contenteditable-url attribute of the edited element
 * @param {Function} [options.onSuccess] - same as {@link SimpleAJAXRequestCallback}, but takes the edited jQuert element as second argument
 */
function initPlainContentEditable(options) {
    var selector = options.selector,
        field = options.field,
        urlBuilder = options.urlBuilder,
        onSuccess = options.onSuccess;

    $(selector).each(function () {
        var $target = $(this),
            $parentLink = $target.closest('a');
        toggleContentEditableParentLink($parentLink);
        $target.on('focus', function () {
            initPlainContentEditableOnFocus($target, field);
        });
        $target.on('blur', function () {
            initPlainContentEditableOnBlur($target, field, urlBuilder, onSuccess)
            toggleContentEditableParentLink($parentLink);
        });

    });
}


/**
 * Usage: add <code>data-contenteditable="%id%"</code> attribute to the element you want to be edited,
 *        add <code>data-contenteditable-target="%id%"</code> attribute to the element you want to be clicked
 *        and initialize this function. <code>%id%</code> means unique string or number, not a real element id.
 * @param {Object} options
 * @param {String} options.activatorSelector - CSS selector
 * @param {String} options.field - name of the field to update
 * @param {Function} [options.urlBuilder] - function that takes the edited jQuery element and returns url to request;
 *                                          if undefined, value will be taken from data-contenteditable-url attribute of the edited element
 * @param {Function} [options.onSuccess] - same as {@link SimpleAJAXRequestCallback}, but takes the edited jQuert element as second argument
 */
function initPlainContentEditableWithActivator(options) {
    var activatorSelector = options.activatorSelector,
        field = options.field,
        urlBuilder = options.urlBuilder,
        onSuccess = options.onSuccess;

    $(activatorSelector).each(function () {
        var $activator = $(this);
        $activator.on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var targetId = $activator.data('contenteditable-target'),
                $target = $('[data-contenteditable=' + targetId + ']'),
                $parentLink = $target.closest('a');
            toggleContentEditableParentLink($parentLink);
            $target.attr({'contenteditable': 'true'});
            $target.on('focus', function () {
                initPlainContentEditableOnFocus($target, field);
            });
            $target.on('blur', function () {
                initPlainContentEditableOnBlur($target, field, urlBuilder, onSuccess);
                $target.off('focus blur');
                $target.removeAttr('contenteditable');
                toggleContentEditableParentLink($parentLink);
            });
            $target.trigger('focus');
        });
    });
}
