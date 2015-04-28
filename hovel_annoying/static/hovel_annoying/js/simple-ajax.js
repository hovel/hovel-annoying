;
/**
 * @typedef {Object} jQuery
 */

/**
 * Function to be called after successful request.
 * @callback SimpleAJAXRequestCallback
 * @param {Object} data - data returned from the server in response.data
 */


/**
 * @param {String} url
 * @param {(jQuery|String|Array)} data - data to send
 * @param {SimpleAJAXRequestCallback} [onSuccess] - function to be called after successful request
 * @param {jQuery} [$errors] - container for error messages
 */
function SimpleAJAXRequest(url, data, onSuccess, $errors) {
    $.ajax({
        url: url,
        data: data,
        dataType: 'json',
        method: 'POST',
        success: function (response, textStatus, jqXHR) {
            if (response.status == 'success') {
                if (typeof onSuccess == 'function') {
                    onSuccess(response.data);
                }
            } else if (response.status == 'fail') {
                if (typeof $errors != 'undefined' && $errors.length) {
                    $.each(response.data, function (field_name, field_data) {
                        $errors.append('<p>' + field_data.label + ': ' + field_data.errors[0].message + '</p>');
                    });
                } else {
                    alert('Что-то пошло не так. Попробуйте обновить страницу.');
                }
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (typeof $errors != 'undefined' && $errors.length) {
                $errors.append('<p>Что-то пошло не так. Попробуйте обновить страницу.</p>');
            } else {
                alert('Что-то пошло не так. Попробуйте обновить страницу.');
            }
        }
    });
}


/**
 * @param {jQuery} $modal - modal window
 * @param {jQuery} $form - form inside $modal
 * @param {SimpleAJAXRequestCallback} [onSuccess] - function to be called after successful request
 * @param {jQuery} [$errors] - container for error messages
 */
function initSimpleModalForm($modal, $form, onSuccess, $errors) {
    $modal.on('hidden.bs.modal', function () {
        $form.trigger('reset');
        $errors.empty();
    });
    $form.on('submit', function (e) {
        e.preventDefault();
        $errors.empty();
        SimpleAJAXRequest($form.attr('action'), $form.serialize(), onSuccess, $errors);
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
        originalValue = $blurred.data('original-' + field);
    if (newValue != originalValue) {
        $.ajax({
            url: urlBuilder($blurred),
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
 * @param {String} selector - CSS selector
 * @param {String} field - name of the field to update
 * @param {Function} urlBuilder - function that takes the edited jQuery element and returns url to request
 * @param {Function} [onSuccess] - same as {@link SimpleAJAXRequestCallback}, but takes the edited jQuert element as second argument
 */
function initPlainContentEditable(selector, field, urlBuilder, onSuccess) {
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
 * @param {String} activatorSelector - CSS selector
 * @param {String} field - name of the field to update
 * @param {Function} urlBuilder - function that takes the edited jQuery element and returns url to request
 * @param {Function} [onSuccess] - same as {@link SimpleAJAXRequestCallback}, but takes the edited jQuert element as second argument
 */
function initPlainContentEditableWithActivator(activatorSelector, field, urlBuilder, onSuccess) {
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
