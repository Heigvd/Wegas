angular.module('wegas.behaviours.repeat.autoload', [])
    .directive('repeatAutoLoad', function($rootScope) {
        "use strict";
        return function(scope, element, attrs) {
            element.bind('scroll', function() {
                var stateScroll = element.height() + element.scrollTop(),
                    maxHeight = this.scrollHeight - 100;
                if (stateScroll >= maxHeight) {
                    $rootScope.$emit("changeLimit", true);
                }
            });
        };
    });
