var BULK_FILE_UPLOAD = {
    uploadIsVisible: false,
    fileCount: 0,
    processedCount: 0,
    validate: function() {
        this.removeAllErrors();
        if ($('#ctsBulkCaseEntry_correspondenceType').val() === '') {
            this.setFieldError('#ctsBulkCaseEntry_correspondenceType', 'ERROR: This value should not be blank.');
            this.setGlobalError('Errors found on form.');
            return false;
        }
        return true;
    },
    setFieldError: function(selector, errorText) {
        $('<div class="individual error">' + errorText + '</div>').insertBefore(selector);
    },
    setGlobalError: function(errorText) {
        $('.global.error').remove();
        $('<div class="global error">' + errorText + '</div>').insertAfter('.panel h2');
    },
    removeAllErrors: function() {
        $('.error').remove();
    },
    setButtonText: function(text) {
        $('<p id="ctsBulkCaseEntry_UploadAndCreate"/>').text(text).replaceAll($('#ctsBulkCaseEntry_UploadAndCreate'));
    },
    updateProgress: function(progress) {
        $('#progress .progress-pct').text(progress + '%');
        $('#progress .bar').css(
            'width',
            progress + '%'
        );
    },
    handleCompleteUpload: function(status, data) {
        this.processedCount++;
        var progress = parseInt((this.processedCount / this.fileCount * 100), 10);
        this.updateProgress(progress);
        if (status === 'success') {
            $.each(data.result.files, function (index, file) {
                $('<span class="success">').text(file.name).appendTo('#files');
                $('#bulk_upload_failures').hide();
            });
        } else {
            $('<span class="failure">').text(data._response.jqXHR.responseText).appendTo('#files');
            $('#bulk_upload_failures').show();
        }

        if (this.processedCount === this.fileCount) {
            this.setButtonText('Complete');
            // hide or disable form inputs
            $('#ctsBulkCaseEntry_correspondenceType').prop('disabled', 'disabled');
            $("#ctsBulkCaseEntry_correspondenceType").trigger("chosen:updated");
            $('#ctsBulkCaseEntry_files, .button.replacement, filename').hide();

            $('#ctsBulkCaseEntry_assignedUnit').prop('disabled', 'disabled');
            $("#ctsBulkCaseEntry_assignedUnit").trigger("chosen:updated");
            $('#ctsBulkCaseEntry_assignedTeam').prop('disabled', 'disabled');
            $("#ctsBulkCaseEntry_assignedTeam").trigger("chosen:updated");
            $('#ctsBulkCaseEntry_assignedUser').prop('disabled', 'disabled');
            $("#ctsBulkCaseEntry_assignedUser").trigger("chosen:updated");

            $('#complete-actions').show();
        }
    },
    checkToggle: function() {
        if (true === this.uploadIsVisible) {
            $('#ctsBulkCaseEntry_UploadAndCreate').closest('div').show();
        }
    }
};

$(function () {

    var $body = $('body');
    // THIS MUST BE BOUND BEFORE THE FILEUPLOAD
    // each time the user picks some files form the widget
    // we reset the file count and remove the context for
    // the previously uploaded files to reset the queue.
    $('#ctsBulkCaseEntry_files').on('change', function() {
        BULK_FILE_UPLOAD.fileCount = 0;
        var buttonParent = $('#ctsBulkCaseEntry_UploadAndCreate').parent();
        var buttonHTML = $('#ctsBulkCaseEntry_UploadAndCreate').parent().html();
        buttonParent.html(buttonHTML);
        buttonParent.closest('div').show();
        BULK_FILE_UPLOAD.uploadIsVisible = true;
    });

    $('#ctsBulkCaseEntry_files').fileupload({
        dataType: 'json',
        singleFileUploads: true,
        add: function (e, data) {
            BULK_FILE_UPLOAD.fileCount++;
            data.context = $('#ctsBulkCaseEntry_UploadAndCreate')
                .click(function () {
                    if (BULK_FILE_UPLOAD.validate()) {
                        $('#progress').show();
                        BULK_FILE_UPLOAD.setButtonText('Uploading...');
                        data.submit();
                    }
                });
        },
        done: function (e, data) {
            BULK_FILE_UPLOAD.handleCompleteUpload('success', data);
        },
        fail: function (e, data) {
            BULK_FILE_UPLOAD.handleCompleteUpload('failure', data);
        }
    });

    $('#ctsBulkCaseEntry_files').bind('fileuploadsubmit', function (e, data) {
        var input = $('#ctsBulkCaseEntry_correspondenceType');
        data.formData = {
            'ctsBulkCaseEntry[correspondenceType]': input.val(),
            'assignedUnit' : $('#ctsBulkCaseEntry_assignedUnit').val(),
            'assignedTeam' : $('#ctsBulkCaseEntry_assignedTeam').val(),
            'assignedUser' : $('#ctsBulkCaseEntry_assignedUser').val()
        };
    });


    if ($('#ctsBulkCaseEntry_assignedUnit')) {
        $body.on(
            'change',
            '#ctsBulkCaseEntry_assignedUnit, #ctsBulkCaseEntry_assignedTeam, #ctsBulkCaseEntry_assignedUser',
            function(e)
            {

            var $select = $(this),
                selectName = $select.get(0).name;

            if ($select.val().length && selectName !== 'ctsBulkCaseEntry[assignedUser]') {
                var data = {
                    field: selectName,
                    value: $select.val()
                };

                $.ajax({
                    'url': $select.closest('div').data('path'),
                    'method': 'get',
                    'data': data,
                    'success': function(data) {
                        var optionsField = $('#' + data.updateField);
                        optionsField.find('option:gt(0)').remove();

                        $.each(data.options, function(index, element){
                            optionsField.append($('<option>', {
                                    value: element.key,
                                    text : element.value
                                })
                            );
                        });

                        optionsField.trigger('chosen:updated');
                    },
                    'error': function() {
                        alert('error');
                    }
                });
            } else if (!$select.val().length) {
                $('#ctsBulkCaseEntry_assignedUser').find('option:gt(0)').remove();
                $('#ctsBulkCaseEntry_assignedTeam').find('option:gt(0)').remove();

            }

            $('#ctsBulkCaseEntry_assignedUser').trigger('chosen:updated');
            $('#ctsBulkCaseEntry_assignedTeam').trigger('chosen:updated');
            $('#ctsBulkCaseEntry_assignedUnit').trigger('chosen:updated');
            BULK_FILE_UPLOAD.checkToggle();
        });
    }
});
