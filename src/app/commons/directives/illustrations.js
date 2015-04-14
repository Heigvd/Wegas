var defaultIcon = {
    color: "orange",
    name: "gamepad"
};
angular.module('wegas.directives.illustrations', [
    'wegas.behaviours.illustrations'
])
    .directive('illustration', function() {
        return {
            templateUrl: 'app/commons/directives/illustrations.tmpl.html',
            scope: {
                "illustration": '@'
            },
            link: function(scope, element, attrs) {
                scope.icon = defaultIcon;

                function changeIcon(illustration) {
                    element.removeClass("illustration--" + scope.icon.color);
                    if (illustration != null && illustration != "") {
                        var infos = illustration.split("_");
                        if (infos.length == 3 && infos[0] == "ICON") {
                            scope.icon = {
                                color: infos[1],
                                name: infos[2]
                            };
                        } else {
                            scope.icon = defaultIcon;
                        }
                    }
                    element.addClass("illustration--" + scope.icon.color);
                };

                changeIcon(scope.illustration);

                scope.$watch(function() {
                    return scope.illustration;
                }, function(n, o) {
                    changeIcon(n);
                });
            }
        };
    });