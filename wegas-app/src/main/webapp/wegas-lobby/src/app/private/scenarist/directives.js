angular.module('private.scenarist.directives', [
    'wegas.behaviours.repeat.autoload'
])
    .controller('ScenaristIndexController', function ScenaristIndexController($q, $scope, $rootScope, ScenariosModel, $timeout) {
        "use strict";
        var ctrl = this,
            initMaxScenariosDisplayed = function() {
                /*if (ctrl.scenarios.length > 22) {
                 ctrl.maxScenariosDisplayed = 20;
                 } else {
                 ctrl.maxScenariosDisplayed = ctrl.scenarios.length;
                 }*/
                ctrl.maxScenariosDisplayed = ctrl.scenarios.length;
            },
            updateDisplayScenarios = function() {
                if (ctrl.maxScenariosDisplayed === null) {
                    initMaxScenariosDisplayed();
                } else {
                    if (ctrl.maxScenariosDisplayed >= ctrl.scenarios.length) {
                        ctrl.maxScenariosDisplayed = ctrl.scenarios.length;
                    } else {
                        ctrl.maxScenariosDisplayed = ctrl.maxScenariosDisplayed + 100;
                    }
                }
            };
        $rootScope.currentRole = "SCENARIST";
        ctrl.loading = true;
        ctrl.duplicating = false;
        ctrl.scenarios = [];
        ctrl.nbArchives = 0;
        ctrl.search = '';
        ctrl.maxScenariosDisplayed = null;

        ctrl.updateScenarios = function(updateDisplay) {
            var hideScrollbarDuringInitialRender = (ctrl.scenarios.length === 0);
            if (hideScrollbarDuringInitialRender) {
                $('#scenarist-scenarios-list').css('overflow-y', 'hidden');
            }
            ctrl.loading = true;
            ScenariosModel.getScenarios('LIVE').then(function(response) {
                ctrl.loading = false;
                ctrl.scenarios = response.data || [];
                if (updateDisplay) {
                    updateDisplayScenarios();
                }
                if (hideScrollbarDuringInitialRender) {
                    $timeout(function() {
                        $('#scenarist-scenarios-list').css('overflow-y', 'auto');
                    }, 2000);
                }
            });
        };

        ctrl.archiveScenario = function(scenario) {
            $('#archive-' + scenario.id).removeClass('button--archive').addClass('busy-button');
            ScenariosModel.archiveScenario(scenario).then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    ctrl.nbArchives += 1;
                    $rootScope.$emit('changeScenarios', true);
                }
                $timeout(function() {
                    $('#archive-' + scenario.id).removeClass('busy-button').addClass('button--archive');
                }, 500);
            });
        };

        ctrl.duplicate = function(scenario) {
            if (ctrl.duplicating)
                return;
            ctrl.duplicating = true;
            $('#dupe-' + scenario.id).addClass('busy-button');
            ScenariosModel.copyScenario(scenario.id).then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    $rootScope.$emit('changeScenarios', true);
                }
                $('#dupe-' + scenario.id).removeClass('busy-button');
                ctrl.duplicating = false;
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

        $rootScope.$on('entrenchNbArchives', function(e, count) {
            ctrl.nbArchives -= count;
        });

        $rootScope.$on('changeLimit', function(e, hasNewData) {
            if (e.currentScope.currentRole === "SCENARIST" && hasNewData) {
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

                scope.cancelScenario = function() {
                    scope.newScenario = {
                        name: "",
                        templateId: 0
                    };
                    scope.$emit('collapse');
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
                search: '=',
                duplicate: '=',
                duplicating: '='
            },
            link: function(scope, element, attrs) {
                var searchField = document.getElementById('searchField').getElementsByClassName('tool__input')[0];
                scope.searchFn = function (value, index, array) { // filter: {name: search, canView: true, canEdit: true}
                    if (value.canView === false || value.canEdit === false) return false;
                    if (searchField.value.length === 0) return true;
                    var needle = searchField.value.toLowerCase();
                    if (value.name.toLowerCase().indexOf(needle) >= 0) return true;
                    // Advanced search criteria:
                    return ((value.createdByName && value.createdByName.toLowerCase().indexOf(needle) >= 0) ||
                            (value.comments && value.comments.toLowerCase().indexOf(needle) >= 0) ||
                            // If searching for a number, the id has to start with the given pattern:
                            value.id.toString().indexOf(needle) === 0);
                };
            }
        };
    })
    .directive('scenarioCard', function() {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/directives.tmpl/card.html',
            scope: {
                scenario: '=',
                archive: '=',
                duplicate: '=',
                duplicating: '=',
                isDuplicated: '='
            },
            link: function(scope) {
                scope.ServiceURL = window.ServiceURL;
            }
        };
    });
