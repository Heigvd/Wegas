angular.module('private.scenarist.directives', [
    'wegas.behaviours.repeat.autoload'
])
    .controller('ScenaristIndexController', function ScenaristIndexController($q, $scope, $rootScope, ScenariosModel) {
        "use strict";
        var ctrl = this,
            initMaxScenariosDisplayed = function() {
                if (ctrl.scenarios.length > 12) {
                    ctrl.maxScenariosDisplayed = 10;
                } else {
                    ctrl.maxScenariosDisplayed = ctrl.scenarios.length;
                }
            },
            updateDisplayScenarios = function() {
                if (ctrl.maxScenariosDisplayed === null) {
                    initMaxScenariosDisplayed();
                } else {
                    if (ctrl.maxScenariosDisplayed >= ctrl.scenarios.length) {
                        ctrl.maxScenariosDisplayed = ctrl.scenarios.length;
                    } else {
                        ctrl.maxScenariosDisplayed = ctrl.maxScenariosDisplayed + 5;
                    }
                }
            };

        ctrl.loading = true;
        ctrl.scenarios = [];
        ctrl.nbArchives = [];
        ctrl.search = '';
        ctrl.maxScenariosDisplayed = null;

        ctrl.updateScenarios = function(updateDisplay) {
            ctrl.loading = true;
            if (updateDisplay) {
                ScenariosModel.countArchivedScenarios().then(function(response) {
                    ctrl.nbArchives = response.data;
                });
            }
            ScenariosModel.getScenarios('LIVE').then(function(response) {
                ctrl.loading = false;
                ctrl.scenarios = response.data || [];
                if (updateDisplay) {
                    updateDisplayScenarios();
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
            var deferred = $q.defer();
            ScenariosModel.createScenario(name, templateId).then(function(response) {
                if (!response.isErroneous()) {
                    $scope.$emit('collapse');
                    ctrl.updateScenarios(true);
                    deferred.resolve(true);
                } else {
                    response.flash();
                    deferred.resolve(true);
                }
            });
            return deferred.promise;
        };
        $rootScope.$on('changeLimit', function(e, hasNewData) {
            if (hasNewData) {
                ctrl.updateScenarios(true);
            }
        });

        /* Listen for scenario update */
        $rootScope.$on('changeScenarios', function(e, hasNewData) {
            if (hasNewData) {
                ctrl.updateScenarios(true);
            }
        });

        ctrl.updateScenarios(true);

        ScenariosModel.countArchivedScenarios().then(function(response) {
            ctrl.nbArchives = response.data;
        });
    })
    .directive('scenaristScenariosIndex', function() {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/directives.tmpl/index.html',
            controller: 'ScenaristIndexController as scenaristIndexCtrl'
        };
    })
    .directive('scenaristScenarioCreate', function(Flash, $translate) {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/directives.tmpl/create.html',
            scope: {
                scenarios: '=',
                create: '='
            },
            link: function(scope, element, attrs) {
                var resetNewScenario = function() {
                    scope.newScenario = {
                        name: '',
                        templateId: 0
                    };
                };
                scope.createScenario = function() {
                    var button = $(element).find(".form__submit");

                    if (scope.newScenario.name !== '') {
                        if (scope.newScenario.templateId !== 0) {
                            if (!button.hasClass("button--disable")) {
                                button.addClass("button--disable button--spinner button--rotate");
                                scope.create(scope.newScenario.name, scope.newScenario.templateId).then(function() {
                                    button.removeClass("button--disable button--spinner button--rotate");
                                    resetNewScenario();
                                });
                            }
                        } else {
                            $translate('COMMONS-SCENARIOS-NO-TEMPLATE-FLASH-ERROR').then(function(message) {
                                Flash.danger(message);
                            });
                        }
                    } else {
                        $translate('COMMONS-SCENARIOS-EMPTY-NAME-FLASH-ERROR').then(function(message) {
                            Flash.danger(message);
                        });
                    }
                };
                resetNewScenario();
            }
        };
    })
    .directive('scenaristScenariosList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/directives.tmpl/list.html',
            scope: {
                scenarios: '=',
                archive: '=',
                maximum: '=',
                search: '='
            }
        };
    })
    .directive('scenarioCard', function() {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/directives.tmpl/card.html',
            scope: {
                scenario: '=',
                archive: '='
            },
            link: function(scope) {
                scope.ServiceURL = window.ServiceURL;
            }
        };
    });
