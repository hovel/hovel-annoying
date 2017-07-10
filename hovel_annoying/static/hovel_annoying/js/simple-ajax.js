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
    var useFormData = (
        typeof window.FormData !== 'undefined'
        && options.data instanceof FormData
    );
    $.ajax({
        url: options.url,
        data: options.data || (useFormData ? new FormData() : ''),
        dataType: 'json',
        method: 'POST',
        processData: !useFormData,
        contentType: useFormData ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
        success: function (response, textStatus, jqXHR) {
            if (response.status === 'success') {
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess(response.data);
                }
            } else if (response.status === 'fail') {
                if (typeof options.onFail === 'function') {
                    options.onFail(response.data);
                } else if (typeof response.data === 'string' && response.data) {
                    alert(response.data);
                } else {
                    alert('Что-то пошло не так. Попробуйте обновить страницу.');
                }
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (typeof options.onError === 'function') {
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
    if (typeof data === 'string') {
        displayError($form.find('.form-group').last(), data);
    } else if (typeof data === 'object') {
        for (var fieldName in data) {
            if (data.hasOwnProperty(fieldName)) {
                var message;
                try {
                    message = data[fieldName].errors[0].message;
                } catch (ex) {
                    continue;
                }
                if (fieldName === '__all__') {
                    displayError($form.find('.form-group').last(), message);
                } else {
                    displayError($form.find('#' + data[fieldName].id), message);
                }
            }
        }
    }

    function displayError($element, message) {
        if (message) {
            $element.after('<small class="' + errorMsgClass.replace(/\./g, ' ') + '">' + message + '</small>');
        }
    }
}


/**
 * @param {Object} options
 * @param {jQuery} options.$form - form inside $modal
 * @param {Boolean} [options.useFormData] - send FormData instead of string
 * @param {Function} [options.onSuccess] - see {@link SimpleAJAXRequest}
 * @param {Function} [options.onFail] - see {@link SimpleAJAXRequest} for calling
 *                                      conditions; takes response.data, $form
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
        var requestOptions = {
            url: $form.attr('action'),
            data: options.useFormData ? new FormData($form[0]) : $form.serialize(),
            onFail: function (data) {
                (options.onFail || displayFormErrors)(data, $form, errorMsgClass);
            }
        }
        if (typeof options.onSuccess === 'function') {
            requestOptions['onSuccess'] = options.onSuccess
        }
        if (typeof options.onError === 'function') {
            requestOptions['onError'] = options.onError
        }
        SimpleAJAXRequest(requestOptions);
    });
}


/**
 * @param {Object} options
 * @param {jQuery} options.$modal - modal window
 * @param {jQuery} options.$form - see {@link initSimpleForm}
 * @param {Boolean} [options.useFormData] - see {@link initSimpleForm}
 * @param {Function} [options.onSuccess] - see {@link initSimpleForm}
 * @param {Function} [options.onFail] - see {@link initSimpleForm}
 * @param {Function} [options.onError] - see {@link initSimpleForm}
 */
function initSimpleModalForm(options) {
    var $modal = options.$modal,
        $form = options.$form,
        errorMsgClass = '.simple-modal-form-error.text-danger';

    $form.on('submit', function (e) {
        e.preventDefault();
        $form.find(errorMsgClass).remove();
        var requestOptions = {
            url: $form.attr('action'),
            data: options.useFormData ? new FormData($form[0]) : $form.serialize(),
            onFail: function (data) {
                (options.onFail || displayFormErrors)(data, $form, errorMsgClass);
                $modal.data('bs.modal').handleUpdate();
            }
        }
        if (typeof options.onSuccess === 'function') {
            requestOptions['onSuccess'] = function (data) {
                options.onSuccess(data);
                $modal.data('bs.modal').handleUpdate();
            }
        }
        if (typeof options.onError === 'function') {
            requestOptions['onError'] = function () {
                options.onError();
                $modal.data('bs.modal').handleUpdate();
            }
        }
        SimpleAJAXRequest(requestOptions);
    });
}
