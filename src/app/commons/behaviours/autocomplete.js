angular.module('wegas.behaviours.autocomplete', [])
.directive('autoComplete', function($timeout) {
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