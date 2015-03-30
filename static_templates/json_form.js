$.ajax({
    url: '__URL__',
    data: JSON.stringify($('__FORM__').serializeArray()),
    dataType: 'json',
    method: 'POST',
    success: function (response, textStatus, jqXHR) {
        if (response.status == 'success') {
            //console.log(response.data)
        } else if (response.status == 'fail') {
            //console.log(response.data.__FIELD__.id)
            //console.log(response.data.__FIELD__.label)
            //console.log(response.data.__FIELD__.errors[0].message)
            //console.log(response.data.__FIELD__.errors[0].code)
        }
    },
    error: function (jqXHR, textStatus, errorThrown) {

    }
});
