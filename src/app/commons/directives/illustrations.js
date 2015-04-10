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
                if (scope.illustration != null && scope.illustration != "") {
                    var infos = scope.illustration.split("_");
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
            }
        };
    });