'use strict';
angular.module('wegas.behaviours.tools', [])
    .directive('toolOpenable', function() {
        return function(scope, element, attr) {
            $(element).find(".tool__link").on("click", function(e) {

                $(element).toggleClass("tool--open");

            });
        };
    });