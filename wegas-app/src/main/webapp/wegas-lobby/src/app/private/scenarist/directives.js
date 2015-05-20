angular.module('private.scenarist.directives', [
    'wegas.behaviours.repeat.autoload'
])
    .controller('ScenaristIndexController', function ScenaristIndexController($scope, $rootScope, ScenariosModel) {
        var ctrl = this,
            initMaxScenariosDisplayed = function() {
                if (ctrl.scenarios.length > 12) {
                    ctrl.maxScenariosDisplayed = 10;
                } else {
                    ctrl.maxScenariosDisplayed = ctrl.scenarios.length;
                }
            };
        ctrl.scenarios = [];
        ctrl.nbArchives = [];
        ctrl.search = '';

        ctrl.maxScenariosDisplayed = null;
        var updateDisplayScenarios = function() {
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
        ctrl.uploadJSON = function(element) {
            ScenariosModel.createFromJSON(element.files[0]).then(function(response) {
                if (!response.isErroneous()) {
                    $rootScope.$emit('changeScenarios', true);
                }
                response.flash();
                element.value = '';
            });
        };
        ctrl.updateScenarios = function(updateDisplay) {
            if(!updateDisplay){
                ScenariosModel.countArchivedScenarios().then(function(response) {
                    ctrl.nbArchives = response.data;
                });
            }
            ScenariosModel.getScenarios('LIVE').then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    ctrl.scenarios = response.data || [];
                    if (updateDisplay) {
                        updateDisplayScenarios();
                    }
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
        };
        $rootScope.$on('changeLimit', function(e, hasNewData) {
            if (hasNewData) {
                ctrl.updateScenarios(true);
            }
        });

        /* Listen for scenario update */
        $rootScope.$on('changeScenarios', function(e, hasNewData) {
            if (hasNewData) {
                ctrl.updateScenarios();
            }
        });
        ctrl.updateScenarios(true);
        ScenariosModel.countArchivedScenarios().then(function(response) {
            ctrl.nbArchives = response.data;
        });
    })
    .directive('scenaristScenariosIndex', function() {
        return {
            templateUrl: 'app/private/scenarist/directives.tmpl/index.html',
            controller: 'ScenaristIndexController as scenaristIndexCtrl'
        };
    })
    .directive('scenaristScenarioCreate', function(Flash) {
        return {
            templateUrl: 'app/private/scenarist/directives.tmpl/create.html',
            scope: {
                scenarios: '=',
                create: '='
            },
            link: function(scope) {
                var resetNewScenario = function() {
                    scope.newScenario = {
                        name: '',
                        templateId: 0
                    };
                };
                scope.createScenario = function() {
                    if (scope.newScenario.name !== '') {
                        if (scope.newScenario.templateId !== 0) {
                            scope.create(scope.newScenario.name, scope.newScenario.templateId);
                            resetNewScenario();
                        } else {
                            Flash.danger('You need to choose a template scenario');
                        }
                    } else {
                        Flash.danger('Name field can not be empty');
                    }
                };
                resetNewScenario();
            }
        };
    })
    .directive('scenaristScenarioCreateUpload', function() {
        return {
            restrict: 'A',
            require: '^scenaristScenariosIndex',
            link: function(scope, element, attrs, parentCtrl) {
                element.bind('change', function() {
                    parentCtrl.uploadJSON(element[0]);
                });
            }
        };
    })
    .directive('scenaristScenariosList', function() {
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
        return {
            templateUrl: 'app/private/scenarist/directives.tmpl/card.html',
            scope: {
                scenario: '=',
                archive: '='
            },
            link: function(scope) {
                scope.ServiceURL = ServiceURL;
                scope.MAX_DISPLAYED_CHARS = MAX_DISPLAYED_CHARS;
            }
        };
    });