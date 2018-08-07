angular
    .module('private.modeler.instances.directives', [
        'ngSanitize'
    ])
    .directive('modelerInstancesIndex', function(ScenariosModel) {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/modeler/instances/directives.tmpl/index.html',
            controller: function($scope, $stateParams, $sce, $rootScope) {
                var ctrl = this;

                ctrl.scenario = undefined;
                ctrl.scenarioId = $stateParams.scenarioId;


                ctrl.updateInstances = function() {
                    ScenariosModel.getScenarios("LIVE").then(function(repsonse) {
                        ctrl.instances = repsonse.data.filter(function(s) {
                            return s.basedOnId === +ctrl.scenarioId;
                        });
                    });
                };

                ScenariosModel.getModel("LIVE", ctrl.scenarioId).then(function(response) {
                    ctrl.scenario = response.data;
                    ctrl.updateInstances();
                });

                $scope.modelerInstancesIndexCtrl = this;
            }
        };
    })
    .directive('modelerInstancesList', function(ScenariosModel) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/instances/directives.tmpl/list.html',
            scope: false,
            require: "^modelerInstancesIndex",
            link: function(scope, element, attrs, parentCtrl) {

                scope.$watch(function() {
                    return parentCtrl.scenario;
                }, function(n, o) {
                    scope.scenario = n;
                });
                scope.$watch(function() {
                    return parentCtrl.instances;
                }, function(n, o) {
                    scope.instances = n;
                });

            }
        };
    })
    .directive('modelerInstancesCard', function(ScenariosModel) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/instances/directives.tmpl/card.html',
            scope: false,
            require: "^modelerInstancesIndex",
            link: function($scope, element, attrs, parentCtrl) {

                $scope.open = function(scenarioId) {
                };
            }
        };
    }).directive('modelerIntegrator', function(ScenariosModel, Flash, $filter, $translate) {
    "use strict";
    return {
        templateUrl: 'app/private/modeler/instances/directives.tmpl/integrator.html',
        scope: false,
        require: "^modelerInstancesIndex",
        link: function(scope, element, attrs, parentCtrl) {

            scope.scenariomenu = [];

            scope.scenarioToIntegrateId = 0;
            scope.loadingScenarios = false;

            var loadScenarios = function() {
                // Reload list from cache each time the window is opened:
                scope.loadingScenarios = true;
                ScenariosModel.getScenarios("LIVE").then(function(response) {
                    if (!response.isErroneous()) {
                        scope.loadingScenarios = false;
                        var expression = {basedOnId: null},
                            filtered = $filter('filter')(response.data, expression) || [];
                        scope.scenariomenu = $filter('orderBy')(filtered, 'name');
                    }
                });
            };

            loadScenarios();

            scope.integrateScenario = function() {
                var button = $(element).find(".form__submit");
                if (scope.scenarioToIntegrateId > 0) {
                    if (!button.hasClass("button--disable")) {
                        button.addClass("button--disable button--spinner button--rotate");

                        ScenariosModel.integrateScenario(scope.scenario.id, scope.scenarioToIntegrateId).then(function() {
                            button.removeClass("button--disable button--spinner button--rotate");
                            scope.scenarioToIntegrateId = 0;
                        });
                    }
                } else {
                    $translate('COMMONS-SCENARIOS-NO-TEMPLATE-FLASH-ERROR').then(function(message) {
                        Flash.danger(message);
                    });
                }
            };

            scope.$watch(function() {
                return parentCtrl.scenario;
            }, function(n, o) {
                scope.scenario = n;
            });
            scope.$watch(function() {
                return parentCtrl.instances;
            }, function(n, o) {
                scope.instances = n;
            });

        }
    };
});
