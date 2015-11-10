angular.module('wegas.behaviours.autocomplete', [])
.directive('autoComplete', function($timeout) {
    "use strict";
    return function(scope, iElement, iAttrs) {
        iElement.autocomplete({
            source: scope[iAttrs.uiItems],
            select: function() {
                $timeout(function() {
                  iElement.trigger('input');
              }, 0);
            }
        });
    };
})
;