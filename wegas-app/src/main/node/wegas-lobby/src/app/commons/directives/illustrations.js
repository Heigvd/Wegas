var defaultIcon = {
    color: "orange",
    name: "gamepad",
    library: "fa"
};
angular.module('wegas.directives.illustrations', [
    'wegas.behaviours.illustrations'
])
    .directive('illustration', function() {
        "use strict";
        return {
            templateUrl: 'app/commons/directives/illustrations.tmpl.html',
            scope: {
                "illustration": '@'
            },
            link: function(scope, element, attrs) {
                scope.icon = defaultIcon;

                function changeIcon(illustration) {
                    element.removeClass("illustration--" + scope.icon.color);
                    if (illustration) {
                        var infos = illustration.split("_");
                        if (infos.length >= 3 && infos[0] === "ICON") {
                            if(!infos[3]){
                                infos[3] = "fa";
                            }
                            scope.icon = {
                                color: infos[1],
                                name: infos[2],
                                library: infos[3]
                            };
                        } else {
                            scope.icon = defaultIcon;
                        }
                    }
                    element.addClass("illustration--" + scope.icon.color);
                }

                changeIcon(scope.illustration);

                scope.$watch(function() {
                    return scope.illustration;
                }, function(n, o) {
                    changeIcon(n);
                });
            }
        };
    });