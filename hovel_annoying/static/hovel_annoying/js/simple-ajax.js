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
        SimpleAJAXRequest($form.attr('action'), $form.serializeArray(), onSuccess, $errors);
    });
}


/**
 * @param {String} selector - CSS selector
 * @param {String} field - name of the field to update
 * @param {Function} urlBuilder - function that takes the edited jQuery element and returns url to request
 * @param {Function} [onSuccess] - same as {@link SimpleAJAXRequestCallback}, but takes the edited jQuert element as second argument
 */
function initPlainContentEditable(selector, field, urlBuilder, onSuccess) {
    $(selector).each(function () {
        var $each = $(this);
        $each.on('focus', function () {
            var $focused = $(this);
            $focused.data('original-' + field, $.trim($focused.text()));
        });
        $each.on('blur', function () {
            var $blurred = $(this),
                value = $.trim($blurred.text());
            if (value == $blurred.data('original-' + field)) {
                return;
            }
            SimpleAJAXRequest(
                urlBuilder($blurred),
                {'field': field, 'value': value},
                function (data) {
                    $blurred.text(data[field]);
                    if (typeof onSuccess == 'function') {
                        onSuccess(data, $blurred);
                    }
                }
            );
        });
    });
}
