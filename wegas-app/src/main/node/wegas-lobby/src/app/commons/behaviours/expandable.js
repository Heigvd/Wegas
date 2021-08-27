angular.module('wegas.behaviours.expandable', [])
    .directive('expandable', function() {
        "use strict";
        return function(scope, element, attrs) {
            scope.$on('expand', function(e, panelId) {
                if (element.attr("expandable") === panelId) {
                    if (!element.hasClass("view--expanded")) {
                        element.addClass("view--expanded");
                    }
                }
            });

            scope.$on('collapse', function(e) {
                if (element.hasClass("view--expanded")) {
                    element.removeClass("view--expanded");
                }
            });
        };
    })
    .directive('expander', function() {
        "use strict";
        return function(scope, element, attrs) {
            element.on("click", function(e) {
                var panelId = e.currentTarget.getAttribute("expander");
                scope.$emit('expand', panelId);
            });

        };
    })
    .directive('collapser', function() {
        "use strict";
        return function(scope, element, attrs) {
            element.on('click', function() {
                scope.$emit('collapse');
            });
        };
    });
