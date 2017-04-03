angular.module('private.scenarist.directives', [
    'wegas.behaviours.repeat.autoload'
])
    .controller('ScenaristIndexController', function ScenaristIndexController($q, $scope, $rootScope, $window, ScenariosModel, $timeout, $filter) {
        "use strict";
        var ctrl = this;
        $rootScope.currentRole = "SCENARIST";
        ctrl.loading = true;
        ctrl.duplicating = false;
        ctrl.search = '';
        ctrl.scenarios = [];
        ctrl.nbArchives = 0;

        var winheight = $window.innerHeight,
            MENU_HEIGHT = 50,
            SEARCH_FIELD_HEIGHT = 72,
            CARD_HEIGHT = 92,
            // Make a quick but safe computation that does not require the page to be rendered beforehand.
            // The number of displayed items must be just high enough to make the scrollbar appear.
            ITEMS_PER_PAGE = Math.ceil((winheight - SEARCH_FIELD_HEIGHT - MENU_HEIGHT) / CARD_HEIGHT),
            ITEMS_IN_FIRST_BATCH = ITEMS_PER_PAGE * 1.5,
            ITEMS_IN_NEXT_BATCHES = ITEMS_PER_PAGE * 3;

        var maxItemsDisplayed = null,
            rawScenarios = [],
            isFiltering = false,
            prevFilter = "",
            filtered = [],
            prevSource = null,

            initMaxItemsDisplayed = function() {
                var len = isFiltering ? filtered.length : rawScenarios.length;
                if (len ===0 || len > ITEMS_IN_FIRST_BATCH) {
                    maxItemsDisplayed = ITEMS_IN_FIRST_BATCH;
                } else {
                    // The number of items is low enough to display them entirely:
                    maxItemsDisplayed = len;
                }
            },
            updateDisplay = function(source) {
                if (prevSource !== source || maxItemsDisplayed !== ctrl.scenarios.length) {
                    ctrl.scenarios = source.slice(0, maxItemsDisplayed);
                    prevSource = source;
                }
            },
            extendDisplayedItems = function() {
                var list = isFiltering ? filtered : rawScenarios;
                if (maxItemsDisplayed === null) {
                    initMaxItemsDisplayed();
                } else {
                    var len = list.length;
                    if (maxItemsDisplayed >= len) {
                        maxItemsDisplayed = len;
                    } else {
                        maxItemsDisplayed = Math.min(maxItemsDisplayed + ITEMS_IN_NEXT_BATCHES, len);
                    }
                }
                updateDisplay(list);
            },
            // Returns an array containing the occurrences of 'needle' in rawScenarios:
            doSearch = function(needle){
                var len = rawScenarios.length,
                    res = [];
                for (var i = 0; i < len; i++) {
                    var scenario = rawScenarios[i];
                    if ((scenario.name && scenario.name.toLowerCase().indexOf(needle) >= 0) ||
                        (scenario.createdByName && scenario.createdByName.toLowerCase().indexOf(needle) >= 0) ||
                        (scenario.comments && scenario.comments.toLowerCase().indexOf(needle) >= 0) ||
                        // If searching for a number, the id has to start with the given pattern:
                        scenario.id.toString().indexOf(needle) === 0) {
                        res.push(scenario);
                    }
                }
                return res;
            };

        /*
         ** Filters rawScenarios according to the given search string and puts the result in ctrl.scenarios.
         ** Hypotheses on input array rawScenarios :
         ** 1. It contains only scenarios with attribute 'canEdit' = true.
         ** 2. It's already ordered according to the 'createdTime' attribute,
         **    so that the output automatically follows the same ordering.
         */
        ctrl.filterScenarios = function(search) {
            if (!search || search.length === 0){
                if (isFiltering){
                    isFiltering = false;
                    initMaxItemsDisplayed(); // Reset since we are changing between searching and not searching
                }
                updateDisplay(rawScenarios);
                return;
            } else { // There is a search going on:
                var needle = search.toLowerCase();
                if (!isFiltering || prevFilter !== needle) {
                    isFiltering = true;
                    prevFilter = needle;
                    filtered = doSearch(needle);
                    initMaxItemsDisplayed(); // Reset since we are changing between searching and not searching or between different searches
                } else {
                    isFiltering = true;
                }
                updateDisplay(filtered);
                if (ctrl.search != search) {
                    ctrl.search = search;
                }
            }
        };

        // Called when a scenario is modified, added or removed:
        ctrl.updateScenarios = function(updateDisplay) {
            var hideScrollbarDuringInitialRender = (ctrl.scenarios.length === 0);
            if (hideScrollbarDuringInitialRender) {
                $('#scenarist-scenarios-list').css('overflow-y', 'hidden');
            }
            ctrl.scenarios = rawScenarios = [];
            ctrl.loading = true;
            ScenariosModel.getScenarios('LIVE').then(function(response) {
                rawScenarios = $filter('filter')(response.data, { canEdit: true } ) || [];
                rawScenarios = $filter('orderBy')(rawScenarios, 'createdTime', true) || [];
                // At this point, the search variable is not necessarily updated by Angular to reflect the input field:
                var searchField = document.getElementById('searchField');
                if (searchField) {
                    ctrl.search = searchField.getElementsByClassName('tool__input')[0].value;
                }
                ctrl.filterScenarios(ctrl.search);
                if (updateDisplay) {
                    extendDisplayedItems();
                }
                if (hideScrollbarDuringInitialRender) {
                    $timeout(function() {
                        $('#scenarist-scenarios-list').css('overflow-y', 'auto');
                    }, 5000);
                }
                // Keep the "loading" indicator on screen as long as possible:
                ctrl.loading = false;
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

        $rootScope.$on('changeLimit', function(e, hasNewData) {
            if (e.currentScope.currentRole === "SCENARIST" && hasNewData) {
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
                duplicating: '='
            },
            link: function(scope) {
                scope.ServiceURL = window.ServiceURL;
            }
        };
    });
