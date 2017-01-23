angular.module('private.scenarist.directives', [])
    .controller('ScenaristIndexController', function ScenaristIndexController($q, $scope, $rootScope, ScenariosModel, $timeout, $filter) {
        "use strict";
        var ctrl = this;
        $rootScope.currentRole = "SCENARIST";
        ctrl.loading = true;
        ctrl.duplicating = false;
        ctrl.rawScenarios = [];
        ctrl.scenarios = [];
        ctrl.nbArchives = 0;
        ctrl.search = '';
        //ctrl.scenariomenu = [];

        /*
         ** Filters ctrl.rawScenarios according to the given search string and puts the result in ctrl.scenarios.
         ** Hypothesis: input array ctrl.rawScenarios is already ordered according to the 'createdTime' attribute,
         ** so that the output automatically follows the same ordering.
         */
        ctrl.filterScenarios = function(search) {
            if (!search || search.length === 0){
                ctrl.scenarios = ctrl.rawScenarios;
                return;
            }
            var res = [],
                len = ctrl.rawScenarios.length,
                i;
            for (i=0; i<len; i++){
                var scenario = ctrl.rawScenarios[i];
                if (scenario.canView === false || scenario.canEdit === false) continue;
                var needle = search.toLowerCase();
                if ((scenario.name && scenario.name.toLowerCase().indexOf(needle) >= 0) ||
                    (scenario.createdByName && scenario.createdByName.toLowerCase().indexOf(needle) >= 0) ||
                    (scenario.comments && scenario.comments.toLowerCase().indexOf(needle) >= 0) ||
                    // If searching for a number, the id has to start with the given pattern:
                    scenario.id.toString().indexOf(needle) === 0) {
                    res.push(scenario);
                }
            }
            ctrl.scenarios = res; // $filter('limitTo')(res, 20);
            if (ctrl.search != search){
                ctrl.search = search;
            }
        };

        // Called when a scenario is modified, added or removed:
        ctrl.updateScenarios = function(updateDisplay) {
            var hideScrollbarDuringInitialRender = (ctrl.scenarios.length === 0);
            if (hideScrollbarDuringInitialRender) {
                $('#scenarist-scenarios-list').css('overflow-y', 'hidden');
            }
            ctrl.scenarios = ctrl.rawScenarios = [];
            ctrl.loading = true;
            ScenariosModel.getScenarios('LIVE').then(function(response) {
                ctrl.loading = false;
                ctrl.rawScenarios = $filter('orderBy')(response.data, 'createdTime', true) || [];
                // At this point, the search variable is not necessarily rendered nor updated by Angular to reflect the input field:
                var searchField = document.getElementById('searchField');
                if (searchField) {
                    ctrl.search = searchField.getElementsByClassName('tool__input')[0].value;
                }
                ctrl.filterScenarios(ctrl.search);
                if (hideScrollbarDuringInitialRender) {
                    $timeout(function() {
                        $('#scenarist-scenarios-list').css('overflow-y', 'auto');
                    }, 5000);
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
                    ctrl.search = "";
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
    .directive('scenaristScenarioCreate', function(ScenariosModel, Flash, $translate, $filter) {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/directives.tmpl/create.html',
            scope: false,
            link: function(scope, element, attrs, parentCtrl) {
                scope.scenariomenu = [];
                scope.loadingScenarios = false;
                var loadScenarios = function() {
                    // Reload list from cache each time the window is opened:
                    scope.loadingScenarios = true;
                    ScenariosModel.getScenarios("LIVE").then(function(response) {
                        if (!response.isErroneous()) {
                            scope.loadingScenarios = false;
                            var expression = { canDuplicate: true },
                                filtered = $filter('filter')(response.data, expression) || [];
                            scope.scenariomenu = $filter('orderBy')(filtered, 'name');
                        }
                    });
                };

                var resetNewScenario = function() {
                    scope.newScenario = {
                        name: '',
                        templateId: 0
                    };
                };

                scope.cancelScenario = function() {
                    resetNewScenario();
                    scope.$emit('collapse');
                };

                scope.createScenario = function() {
                    var button = $(element).find(".form__submit");
                    if (scope.newScenario.name !== '') {
                        if (scope.newScenario.templateId !== 0) {
                            if (!button.hasClass("button--disable")) {
                                button.addClass("button--disable button--spinner button--rotate");
                                scope.scenaristIndexCtrl.createScenario(scope.newScenario.name, scope.newScenario.templateId).then(function() {
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

                scope.$on('expand', function() {
                    resetNewScenario();
                    loadScenarios();
                });
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
                search: '=',
                duplicate: '=',
                duplicating: '='
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
