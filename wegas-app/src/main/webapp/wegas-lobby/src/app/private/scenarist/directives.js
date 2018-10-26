angular.module('private.scenarist.directives', [
    'wegas.behaviours.repeat.autoload'
])
    .controller('ScenaristIndexController', function ScenaristIndexController($q, $scope, $rootScope, $window, ScenariosModel, $timeout, $filter, Auth, UsersModel) {
        "use strict";
        var ctrl = this;
        $rootScope.currentRole = "SCENARIST";
        ctrl.loading = true;
        ctrl.duplicating = false;
        ctrl.search = '';
        ctrl.scenarios = [];
        ctrl.rawScenarios = [];
        ctrl.nbArchives = 0;
        ctrl.user = {};
        ctrl.username = '';
        ctrl.mefirst = false;

        ctrl.handlers = {};

        var MENU_HEIGHT = 50,
            SEARCH_FIELD_HEIGHT = 72,
            CARD_HEIGHT = 92,
            ITEMS_PER_PAGE,
            ITEMS_IN_FIRST_BATCH,
            ITEMS_IN_NEXT_BATCHES;

        var winheight = null,
            maxItemsDisplayed = null,
            isFiltering = false,
            prevFilter = "",
            filtered = [],
            prevSource = null,
            // Adjusts layout constants to the current window size.
            checkWindowSize = function() {
                if (winheight !== $window.innerHeight) {
                    // Make a quick but safe computation that does not require the page to be rendered beforehand.
                    // The number of displayed items must be just high enough to make the scrollbar appear.
                    winheight = $window.innerHeight;
                    ITEMS_PER_PAGE = Math.ceil((winheight - SEARCH_FIELD_HEIGHT - MENU_HEIGHT) / CARD_HEIGHT);
                    ITEMS_IN_FIRST_BATCH = ITEMS_PER_PAGE * 1.5;
                    ITEMS_IN_NEXT_BATCHES = ITEMS_PER_PAGE * 3;
                }
            },
            // Computes the number of elements to display.
            initMaxItemsDisplayed = function() {
                checkWindowSize();
                var len = currentList().length;
                if (len === 0 || len > ITEMS_IN_FIRST_BATCH) {
                    maxItemsDisplayed = ITEMS_IN_FIRST_BATCH;
                } else {
                    // The number of items is low enough to display them entirely:
                    maxItemsDisplayed = len;
                }
            },
            // Returns the session list to be displayed now.
            currentList = function() {
                return isFiltering ? filtered : ctrl.rawScenarios;
            },
            updateDisplay = function(source) {
                if (prevSource !== source || maxItemsDisplayed !== ctrl.scenarios.length) {
                    ctrl.scenarios = source.slice(0, maxItemsDisplayed);
                    prevSource = source;
                }
            },
            extendDisplayedItems = function() {
                var list = currentList();
                if (maxItemsDisplayed === null) {
                    initMaxItemsDisplayed();
                } else {
                    maxItemsDisplayed = Math.min(maxItemsDisplayed + ITEMS_IN_NEXT_BATCHES, list.length);
                }
                updateDisplay(list);
            },
            // Returns an array containing the occurrences of 'needle' in ctrl.rawScenarios:
            doSearch = function(needle) {
                var len = ctrl.rawScenarios.length,
                    res = [];
                for (var i = 0; i < len; i++) {
                    var scenario = ctrl.rawScenarios[i];
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
         ** Updates the listing when the user has clicked on the "My scenarios first" checkbox,
         ** and also during initial page rendering.
         */
        ctrl.setMeFirst = function(mefirst, updateDisplay) {
            if (mefirst === undefined)
                return;
            ctrl.mefirst = mefirst;
            // Update the checkbox in the UI:
            var cbx = $('#mefirst');
            if (cbx.length > 0) {
                if (mefirst) {
                    cbx.addClass("selected");
                } else {
                    cbx.removeClass("selected");
                }
            }
            isFiltering = false;
            ctrl.updateScenarios(updateDisplay);
        }

        // Updates the listing when the user has clicked on the "My scenarios first" checkbox.
        ctrl.toggleMeFirst = function() {
            ctrl.setMeFirst(!ctrl.mefirst);
            var config = localStorage.getObject("wegas-config");
            config.commons.myScenariosFirst = ctrl.mefirst;
            localStorage.setObject("wegas-config", config);
        }

        ctrl.initMeFirst = function() {
            if (ctrl.user) {
                if (ctrl.user.isAdmin) {
                    if (ctrl.username.length > 0) {
                        // Load the "My scenarios first" preference, defaulting to true:
                        var config = localStorage.getObject("wegas-config"),
                            mefirst = config.commons && config.commons.myScenariosFirst !== false;
                        ctrl.setMeFirst(mefirst, true);
                    } // else: ignore as long as required information is missing
                } else {
                    // Initialization for non-admin users:
                    ctrl.setMeFirst(false, true);
                }
            }
        }

        /*
         ** Filters ctrl.rawScenarios according to the given search string and puts the result in ctrl.scenarios.
         ** Hypotheses on input array ctrl.rawScenarios :
         ** 1. It contains only scenarios with attribute 'canEdit' = true.
         ** 2. It's already ordered according to the 'createdTime' attribute,
         **    so that the output automatically follows the same ordering.
         */
        ctrl.filterScenarios = function(search) {
            if (!search || search.length === 0) {
                if (isFiltering) {
                    isFiltering = false;
                    initMaxItemsDisplayed(); // Reset since we are changing between searching and not searching
                }
                updateDisplay(ctrl.rawScenarios);
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

        // Called when a scenario is modified, reordered, added or removed:
        ctrl.updateScenarios = function(updateDisplay) {
            var hideScrollbarDuringInitialRender = (ctrl.scenarios.length === 0);
            if (hideScrollbarDuringInitialRender) {
                $('#scenarist-scenarios-list').css('overflow-y', 'hidden');
            }
            ctrl.scenarios = [];
            ctrl.rawScenarios = [];
            ctrl.models = [];

            ctrl.loading = true;
            ctrl.modelLoading = true;

            ScenariosModel.getModels('LIVE').then(function(response) {
                ctrl.models = response.data;
                ScenariosModel.getModels('BIN').then(function(response) {
                    ctrl.models = ctrl.models.concat(response.data);
                    ctrl.modelLoading = false;
                });
            });

            ScenariosModel.getScenarios('LIVE').then(function(response) {
                ctrl.rawScenarios = $filter('filter')(response.data, {canEdit: true}) || [];
                if (ctrl.mefirst && ctrl.username.length > 0) {
                    // Prepare a list where "my" scenarios appear first (ordered by creation date, like the rest):
                    var myScenarios = $filter('filter')(ctrl.rawScenarios, {createdByName: ctrl.username}) || [],
                        otherScenarios = $filter('filter')(ctrl.rawScenarios, {createdByName: '!' + ctrl.username}) || [];
                    myScenarios = $filter('orderBy')(myScenarios, 'createdTime', true) || [];
                    otherScenarios = $filter('orderBy')(otherScenarios, 'createdTime', true) || [];
                    ctrl.rawScenarios = myScenarios.concat(otherScenarios);
                } else {
                    ctrl.rawScenarios = $filter('orderBy')(ctrl.rawScenarios, 'createdTime', true) || [];
                }
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

        ctrl.getModelName = function(modelId) {
            var m = $filter('filter')(ctrl.models, {id: modelId});
            return (m && m.length > 0) ? m[0].name : "";
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

        ctrl.handlers.entrenchNbArchives = $rootScope.$on('entrenchNbArchives', function(e, count) {
            ctrl.nbArchives -= count;
        });

        // Listen for updates to individual scenarios or to the list of scenarios:
        ctrl.handlers.changeScenarios = $rootScope.$on('changeScenarios', function(e, hasNewData) {
            if (hasNewData) {
                // To be on the safe side, also request an extension of displayed scenarios (parameter 'true'):
                ctrl.updateScenarios(true);
            }
        });

        // Listen for scroll down events and extend the set of visible items without rebuilding the whole list:
        ctrl.handlers.changeLimit = $rootScope.$on('changeLimit', function(e, hasNewData) {
            if (e.currentScope.currentRole === "SCENARIST") {
                extendDisplayedItems();
                if (!$rootScope.$$phase) {
                    $scope.$apply();
                }
            }
        });

        // This is jQuery code for detecting window resizing:
        $(window).on("resize.doResize", _.debounce(function() {
            $scope.$apply(function() {
                initMaxItemsDisplayed();
                updateDisplay(currentList());
            });
        }, 100));

        // When leaving, remove the window resizing handler:
        $scope.$on("$destroy", function() {
            //$(window).off("resize.doResize");
            for (var key in ctrl.handlers) {
                ctrl.handlers[key]();
            }
        });

        // Find out if the current user has admin rights and what his "friendly" username is.
        Auth.getAuthenticatedUser().then(function(user) {
            if (user !== false) {
                ctrl.user = user;
                if (user.isAdmin) {
                    UsersModel.getFullUser(user.id).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                        } else {
                            ctrl.username = response.data.name;
                        }
                        // The init routine needs the admin username for filtering
                        ctrl.initMeFirst();
                    })
                } else {
                    ctrl.initMeFirst();
                }
            }
        });

        // Finally, load info about archived scenarios:
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
                scope.rawscenariomenu = [];

                scope.loadingScenarios = false;

                var loadScenarios = function() {
                    // Reload list from cache each time the window is opened:
                    scope.loadingScenarios = true;
                    ScenariosModel.getScenarios("LIVE").then(function(response) {
                        if (!response.isErroneous()) {
                            var expression = {canDuplicate: true},
                                filtered = $filter('filter')(response.data, expression) || [];
                            ScenariosModel.getModels("LIVE").then(function(response) {
                                if (!response.isErroneous()) {
                                    scope.loadingScenarios = false;
                                    var expr = {canInstantiate: true},
                                        filtered2 = $filter("filter")(response.data, expr) || [];
                                    scope.rawscenariomenu = $filter('orderBy')(filtered.concat(filtered2), 'name');
                                    updateDisplay(scope.rawscenariomenu);
                                }
                            });
                        }
                    });
                };

                var resetNewScenario = function() {
                    scope.newScenario = {
                        name: '',
                        templateId: 0,
                        search: ''
                    };
                };

                scope.cancelScenario = function() {
                    resetNewScenario();
                    scope.$emit('collapse');
                };

                var updateDisplay = function(scenarioList) {
                    scope.scenariomenu = scenarioList;
                };


                scope.filterScenarios = function(search) {
                    if (search && search.length > 0) {
                        var needle = search.toLowerCase();
                        var filtered = [];
                        for (var i in scope.rawscenariomenu) {
                            var scen = scope.rawscenariomenu[i];
                            if (scen.name.toLowerCase().indexOf(needle) >= 0) {
                                filtered.push(scen);
                            }
                        }
                        updateDisplay(filtered);
                    } else {
                        updateDisplay(scope.rawscenariomenu);
                    }
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

                var onExpand = scope.$on('expand', function() {
                    resetNewScenario();
                    loadScenarios();
                });


                scope.$on("$destroy", function() {
                    onExpand && onExpand();
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
                modelname: '=',
                modelloading: '=',
                search: '=',
                duplicate: '=',
                duplicating: '=',
                user: '=',
                username: '=',
                mefirst: '='
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
                modelname: '=',
                modelloading: '=',
                duplicate: '=',
                duplicating: '=',
                user: '=',
                username: '='
            },
            link: function(scope) {
                scope.ServiceURL = window.ServiceURL;
            }
        };
    });
