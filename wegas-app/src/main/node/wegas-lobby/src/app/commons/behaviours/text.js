'use strict';
angular.module('wegas.behaviours.text', [])
    .directive('textSelectable', function() {
        return function(scope, element, attr) {
            $('html').click(function(event) {
                $('#text--selectable--tmp').remove();
            });
            $(element).click(function(event) {
                event.stopPropagation();
                if ($('#text--selectable--tmp').length) {
                    $('#text--selectable--tmp').remove();
                }
                var clickText = $(this).text();
                $('<textarea id="text--selectable--tmp" />').attr("readonly", "readonly").appendTo($(this)).val(clickText).focus().select();
                return false;
            });
        };
    });