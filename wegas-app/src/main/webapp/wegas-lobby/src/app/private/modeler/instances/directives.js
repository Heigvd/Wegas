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
    });
