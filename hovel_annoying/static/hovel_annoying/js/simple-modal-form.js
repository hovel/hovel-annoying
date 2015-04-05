;function SimpleModalForm(options) {
    var SMF = this;
    if (typeof options != 'object' || $.isEmptyObject(options)) {
        console.error('Please set the options.');
    }
    SMF.$modal = $(options.modal);
    SMF.$form = $(options.form);
    SMF.$errors = $(options.errors);
    SMF.on_success = options.on_success;
}
SimpleModalForm.prototype.bind = function () {
    var SMF = this;
    SMF.$modal.on('hidden.bs.modal', function () {
        SMF.$form.trigger('reset');
        SMF.$errors.empty();
    });
    SMF.$form.on('submit', function (e) {
        e.preventDefault();
        SMF.$errors.empty();
        $.ajax({
            url: SMF.$form.attr('action'),
            data: JSON.stringify(SMF.$form.serializeArray()),
            dataType: 'json',
            method: 'POST',
            success: function (response, textStatus, jqXHR) {
                if (response.status == 'success') {
                    if (typeof SMF.on_success == 'function') {
                        SMF.on_success();
                    } else {
                        window.location.reload();
                    }
                } else if (response.status == 'fail') {
                    $.each(response.data, function (field_name, field_data) {
                        SMF.$errors.append('<p>' + field_data.label + ': ' + field_data.errors[0].message + '</p>');
                    });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                SMF.$errors.append('<p>Что-то пошло не так. Попробуйте обновить страницу.</p>');
            }
        });
    });
};
