angular.module('private.scenarist.scenarios.directives', [
    'infinite-scroll'
])
    .controller('ScenaristScenariosIndexController', function ScenaristScenariosIndexController($scope, $rootScope, ScenariosModel, Flash) {
        var ctrl = this;
        ctrl.scenarios = [];
        ctrl.archives = [];

        ctrl.updateScenarios = function() {
            ScenariosModel.getScenarios("BIN").then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    ctrl.archives = response.data || [];
                }
            });
            ScenariosModel.getScenarios("LIVE").then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    ctrl.scenarios = response.data || [];
                }
            });
        };

        ctrl.archiveScenario = function(scenario) {
            ScenariosModel.archiveScenario(scenario).then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    $rootScope.$emit('changeScenarios', true);
                }
            });
        };
        ctrl.createScenario = function(name, templateId) {
            ScenariosModel.createScenario(name, templateId).then(function(response) {
                if (!response.isErroneous()) {
                    $rootScope.$emit('changeScenarios', true);
                } else {
                    response.flash();
                }
            });
        }

        /* Listen for session update */
        $rootScope.$on('changeScenarios', function(e, hasNewData) {
            if (hasNewData) {
                ctrl.updateScenarios();
            }
        });
        
        $rootScope.$emit('changeScenarios', true);
    })
    .directive('scenaristScenariosIndex', function() {
        return {
            templateUrl: 'app/private/scenarist/scenarios/directives.tmpl/index.html',
            controller: "ScenaristScenariosIndexController as scenariosIndexCtrl"
        };
    })
    .directive('scenaristScenarioCreate', function(Flash) {
        return {
            templateUrl: 'app/private/scenarist/scenarios/directives.tmpl/create.html',
            scope: {
                scenarios: "=",
                create: "="
            },
            link: function(scope, elem, attrs) {
                var resetNewScenario = function() {
                    scope.newScenario = {
                        name: "",
                        templateId: 0
                    };
                };
                scope.createScenario = function() {
                    if (scope.newScenario.name !== "") {
                        if (scope.newScenario.templateId !== 0) {
                            scope.create(scope.newScenario.name, scope.newScenario.templateId);
                            resetNewScenario();
                        } else {
                            Flash.danger("You need to choose a template scenario");
                        }
                    } else {
                        Flash.danger("Name field can not be empty");
                    }
                }
                resetNewScenario();
            }
        };
    })
    .directive('scenaristScenariosList', function(ScenariosModel) {
        return {
            templateUrl: 'app/private/scenarist/scenarios/directives.tmpl/list.html',
            scope: {
                scenarios:"=",
                archives:"=",
                archive:"="
            },
            link: function(scope, element, attrs) {
                scope.visibleScenarios = [];
                scope.busy = false;
                scope.search = '';

                scope.filter = function() {
                    if (scope.search == '') {
                        scope.visibleScenarios = [];
                        scope.loadMore();
                    } else if (scope.search == '*') {
                        scope.visibleScenarios = scope.scenarios;
                    } else {
                        scope.visibleScenarios = _.filter(scope.scenarios, function(s) {
                            return s.name.toLowerCase().indexOf(scope.search.toLowerCase()) > -1;
                        });
                    }
                }
                scope.loadMore = function() {
                    if ((!scope.busy) && (scope.search == '') && (scope.scenarios.length > 0)){
                        scope.busy = true;
                        var last = scope.visibleScenarios.length;
                        var minlength = Math.min(scope.scenarios.length, 13);
                        for (var i = last; i < last + minlength; i++) {
                            scope.visibleScenarios.push(scope.scenarios[i]);
                        }
                        scope.busy = false;
                    }
                };

                scope.$watch(function() {
                    return scope.scenarios;
                }, function(newScenarios) {
                    if (newScenarios !== undefined && newScenarios.length > 0) {
                        scope.filter();
                    }
                });
            }
        };
    })
    .directive('scenarioCard', function() {
        return {
            templateUrl: 'app/private/scenarist/scenarios/directives.tmpl/card.html',
            scope: {
                scenario: '=',
                archive: "="
            },
            link: function(scope, element, attrs) {
                scope.ServiceURL = ServiceURL;
            }
        }
    });