/* Based on http://plnkr.co/edit/YWr6o2?p=preview */
angular.module('wegas.behaviours.confirm', [])
    .directive('ngConfirmClick', function() {
        return function(scope, element, attr) {
            var msg = attr.ngConfirmClick || "Are you sure?";
            var clickAction = attr.confirmedClick;
            element.bind('click', function(event) {
                if (window.confirm(msg)) {
                    scope.$eval(clickAction);
                }
            });
        };
    });