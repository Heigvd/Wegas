'use strict';
angular.module('wegas.behaviours.text', [])
    .directive('textSelectable', function() {
        return function(scope, element, attr) {
            $('html').click(function(event) {
                $('#tmp').remove();
            });
            $(element).click(function(event) {
                event.stopPropagation();
                if ($('#tmp').length) {
                    $('#tmp').remove();
                }
                var clickText = $(this).text();
                $('<textarea id="tmp" />').attr("readonly", "readonly").appendTo($(this)).val(clickText).focus().select();
                return false;
            });
        };
    });