;
function SimpleAJAXRequest(url, data, onsuccess, $errors) {
    /**
     * @param {String} url
     * @param data - data which ready to be encoded as a JSON string
     * @param {Function} onsuccess - will be called after successful request, takes response.data as argument
     * @param {Object} $errors - (jQuery) container for error messages
     */
    $.ajax({
        url: url,
        data: JSON.stringify(data),
        dataType: 'json',
        method: 'POST',
        success: function (response, textStatus, jqXHR) {
            if (response.status == 'success') {
                if (typeof onsuccess == 'function') {
                    onsuccess(response.data);
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

function initSimpleModalForm($modal, $form, onsuccess, $errors) {
    /**
     * @param {Object} $modal - (jQuery) modal window
     * @param {Object} $form - (jQuery) form inside $modal
     * @param {Function} onsuccess - will be called after successful request, takes response.data as argument
     * @param {Object} $errors - (jQuery) container for error messages
     */
    $modal.on('hidden.bs.modal', function () {
        $form.trigger('reset');
        $errors.empty();
    });
    $form.on('submit', function (e) {
        e.preventDefault();
        $errors.empty();
        SimpleAJAXRequest($form.attr('action'), $form.serializeArray(), onsuccess, $errors);
    });
}
