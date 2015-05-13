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
                } else if (typeof response.data == 'string' && response.data) {
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
    if (!data) {
        return;
    }

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
 * @param {jQuery} options.$form - see {@link initSimpleForm}
 * @param {Function} [options.onSuccess] - see {@link initSimpleForm}
 * @param {Function} [options.onFail] - see {@link initSimpleForm}
 * @param {Function} [options.onError] - see {@link initSimpleForm}
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
