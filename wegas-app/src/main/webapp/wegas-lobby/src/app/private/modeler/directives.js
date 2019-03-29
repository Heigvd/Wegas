angular.module('private.modeler.directives', [
    'wegas.behaviours.repeat.autoload'
])
    .controller('ModelerIndexController', function ModelerIndexController($q, $scope, $rootScope, $window, ScenariosModel, $timeout, $filter, Auth, UsersModel) {
        "use strict";
        var ctrl = this;
        $rootScope.currentRole = "MODELER";
        ctrl.loading = true;
        ctrl.duplicating = false;
        ctrl.search = '';
        ctrl.models = [];
        ctrl.nbArchives = 0;
        ctrl.user = {};
        ctrl.username = '';
        ctrl.mefirst = false;

        var MENU_HEIGHT = 50,
            SEARCH_FIELD_HEIGHT = 72,
            CARD_HEIGHT = 92,
            ITEMS_PER_PAGE,
            ITEMS_IN_FIRST_BATCH,
            ITEMS_IN_NEXT_BATCHES;

        var winheight = null,
            maxItemsDisplayed = null,
            rawModels = [],
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
                return isFiltering ? filtered : rawModels;
            },
            updateDisplay = function(source) {
                if (prevSource !== source || maxItemsDisplayed !== ctrl.models.length) {
                    ctrl.models = source.slice(0, maxItemsDisplayed);
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
            // Returns an array containing the occurrences of 'needle' in rawModels:
            doSearch = function(needle) {
                var len = rawModels.length,
                    res = [];
                for (var i = 0; i < len; i++) {
                    var model = rawModels[i];
                    if ((model.name && model.name.toLowerCase().indexOf(needle) >= 0) ||
                        (model.createdByName && model.createdByName.toLowerCase().indexOf(needle) >= 0) ||
                        (model.comments && model.comments.toLowerCase().indexOf(needle) >= 0) ||
                        // If searching for a number, the id has to start with the given pattern:
                        model.id.toString().indexOf(needle) === 0) {
                        res.push(model);
                    }
                }
                return res;
            };

        /*
         ** Updates the listing when the user has clicked on the "My models first" checkbox,
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
            ctrl.updateModels(updateDisplay);
        }

        // Updates the listing when the user has clicked on the "My models first" checkbox.
        ctrl.toggleMeFirst = function() {
            ctrl.setMeFirst(!ctrl.mefirst);
            var config = localStorage.getObject("wegas-config");
            config.commons.myModelsFirst = ctrl.mefirst;
            localStorage.setObject("wegas-config", config);
        }

        ctrl.initMeFirst = function() {
            if (ctrl.user) {
                if (ctrl.user.isAdmin) {
                    if (ctrl.username.length > 0) {
                        // Load the "My models first" preference, defaulting to true:
                        var config = localStorage.getObject("wegas-config"),
                            mefirst = config.commons && config.commons.myModelsFirst !== false;
                        ctrl.setMeFirst(mefirst, true);
                    } // else: ignore as long as required information is missing
                } else {
                    // Initialization for non-admin users:
                    ctrl.setMeFirst(false, true);
                }
            }
        };

        /*
         ** Filters rawModels according to the given search string and puts the result in ctrl.models.
         ** Hypotheses on input array rawModels :
         ** 1. It contains only editable models (ie EDIT or TRANSLATE permission)
         ** 2. It's already ordered according to the 'createdTime' attribute,
         **    so that the output automatically follows the same ordering.
         */
        ctrl.filterModels = function(search) {
            if (!search || search.length === 0) {
                if (isFiltering) {
                    isFiltering = false;
                    initMaxItemsDisplayed(); // Reset since we are changing between searching and not searching
                }
                updateDisplay(rawModels);
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

        // Called when a model is modified, reordered, added or removed:
        ctrl.updateModels = function(updateDisplay) {
            var hideScrollbarDuringInitialRender = (ctrl.models.length === 0);
            if (hideScrollbarDuringInitialRender) {
                $('#modeler-models-list').css('overflow-y', 'hidden');
            }
            ctrl.models = rawModels = [];
            ctrl.loading = true;

            ScenariosModel.getGameModelsByStatusTypeAndPermission("MODEL", "LIVE", ["EDIT", "TRANSLATE"]).then(function(gameModels) {
                rawModels = gameModels.data;

                if (ctrl.mefirst && ctrl.username.length > 0) {
                    // Prepare a list where "my" models appear first (ordered by creation date, like the rest):
                    var myModels = $filter('filter')(rawModels, {createdByName: ctrl.username}) || [],
                        otherModels = $filter('filter')(rawModels, {createdByName: '!' + ctrl.username}) || [];
                    myModels = $filter('orderBy')(myModels, 'createdTime', true) || [];
                    otherModels = $filter('orderBy')(otherModels, 'createdTime', true) || [];
                    rawModels = myModels.concat(otherModels);
                } else {
                    rawModels = $filter('orderBy')(rawModels, 'createdTime', true) || [];
                }
                // At this point, the search variable is not necessarily updated by Angular to reflect the input field:
                var searchField = document.getElementById('searchField');
                if (searchField) {
                    ctrl.search = searchField.getElementsByClassName('tool__input')[0].value;
                }
                ctrl.filterModels(ctrl.search);
                if (updateDisplay) {
                    extendDisplayedItems();
                }
                if (hideScrollbarDuringInitialRender) {
                    $timeout(function() {
                        $('#modeler-models-list').css('overflow-y', 'auto');
                    }, 5000);
                }
                // Keep the "loading" indicator on screen as long as possible:
                ctrl.loading = false;
            });
        };

        ctrl.archiveModel = function(model) {
            $('#archive-' + model.id).removeClass('button--archive').addClass('busy-button');
            ScenariosModel.archiveScenario(model).then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    ctrl.nbArchives += 1;
                    $rootScope.$emit('changeModels', true);
                }
                $timeout(function() {
                    $('#archive-' + model.id).removeClass('busy-button').addClass('button--archive');
                }, 500);
            });
        };

        ctrl.hasEditPermission = function(gameModel) {
            return ScenariosModel.hasAnyPermissions(gameModel, "EDIT");
        };

        ctrl.duplicate = function(model) {
            if (ctrl.duplicating)
                return;
            ctrl.duplicating = true;
            $('#dupe-' + model.id).addClass('busy-button');
            ScenariosModel.copyScenario(model.id).then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    $rootScope.$emit('changeModels', true);
                }
                $('#dupe-' + model.id).removeClass('busy-button');
                ctrl.duplicating = false;
            });
        };


        ctrl.extractModel = function(name, templateIds) {
            var deferred = $q.defer();
            ScenariosModel.extractModel(name, templateIds).then(function(response) {
                if (!response.isErroneous()) {
                    $scope.$emit('collapse');
                    ctrl.search = "";
                    ctrl.updateModels(true);
                    deferred.resolve(true);
                } else {
                    response.flash();
                    deferred.resolve(true);
                }
            });
            return deferred.promise;
        };


        ctrl.createModel = function(name, templateId) {
            var deferred = $q.defer();
            ScenariosModel.createModel(name, templateId).then(function(response) {
                if (!response.isErroneous()) {
                    $scope.$emit('collapse');
                    ctrl.search = "";
                    ctrl.updateModels(true);
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

        // Listen for updates to individual models or to the list of models:
        $rootScope.$on('changeModels', function(e, hasNewData) {
            if (hasNewData) {
                // To be on the safe side, also request an extension of displayed models (parameter 'true'):
                ctrl.updateModels(true);
            }
        });

        // Listen for scroll down events and extend the set of visible items without rebuilding the whole list:
        $rootScope.$on('changeLimit', function(e, hasNewData) {
            if (e.currentScope.currentRole === "MODELER") {
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

        // Finally, load info about archived models:
        ScenariosModel.countArchivedModels().then(function(response) {
            ctrl.nbArchives = response.data;
        });

    })
    .directive('modelerModelsIndex', function() {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/directives.tmpl/index.html',
            controller: 'ModelerIndexController as modelerIndexCtrl'
        };
    })

    .directive('modelerModelExtract', function(ScenariosModel, Flash, $translate, $filter) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/directives.tmpl/extract.html',
            scope: false,
            link: function(scope, element, attrs, parentCtrl) {

                scope.scenariomenu = [];
                scope.rawscenariomenu = [];
                scope.loadingScenarios = false;
                var loadScenarios = function() {
                    // Reload list from cache each time the window is opened:
                    scope.loadingScenarios = true;
                    ScenariosModel.getGameModelsByStatusTypeAndPermission("SCENARIO", "LIVE", ["EDIT"]).then(function(response){
                        if (!response.isErroneous()) {
                            scope.loadingScenarios = false;
                            scope.rawscenariomenu = $filter('orderBy')(response.data, 'name');
                            updateDisplay(scope.rawscenariomenu);
                        }
                    });
                };

                var updateDisplay = function(scenarioList) {
                    scope.scenariomenu = scenarioList;
                };

                var resetNewModel = function() {
                    scope.newModel = {
                        name: '',
                        templateId: 0
                    };
                    scope.selectedIds = [];
                };

                scope.extractsearch = '';


                scope.filterScenarios = function(search) {
                    if (search && search.length > 0) {
                        var needle = search.toLowerCase();
                        var filtered = [];
                        for (var i in scope.rawscenariomenu) {
                            var scen = scope.rawscenariomenu[i];
                            if (scen.name.toLowerCase().indexOf(needle) >= 0 ||
                                scope.selectedIds[scen.id]) {
                                filtered.push(scen);
                            }
                        }
                        updateDisplay(filtered);
                    } else {
                        updateDisplay(scope.rawscenariomenu);
                    }
                };

                scope.cancelModel = function() {
                    resetNewModel();
                    scope.$emit('collapse');
                };

                scope.extractModel = function() {
                    var button = $(element).find(".form__submit");
                    if (scope.newModel.name !== '') {
                        var ids = _.transform(scope.selectedIds, function(result, value, key) {
                            if (value) {
                                result.push(key);
                            }
                            return result;
                        }, []);
                        if (ids.length > 0) {
                            if (!button.hasClass("button--disable")) {
                                button.addClass("button--disable button--spinner button--rotate");

                                scope.modelerIndexCtrl.extractModel(scope.newModel.name, ids).then(function() {
                                    button.removeClass("button--disable button--spinner button--rotate");
                                    resetNewModel();
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
                    resetNewModel();
                    loadScenarios();
                });
            }
        };
    })

    .directive('modelerModelCreate', function(ScenariosModel, Flash, $translate, $filter) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/directives.tmpl/create.html',
            scope: false,
            link: function(scope, element, attrs, parentCtrl) {
                scope.modelsmenu = [];
                scope.rawmodelsmenu = [];
                scope.loadingModels = false;
                var loadModels = function() {
                    // Reload list from cache each time the window is opened:
                    scope.loadingModels = true;

                    ScenariosModel.getGameModelsByStatusTypeAndPermission("MODEL", "LIVE", "DUPLICATE").then(function(response) {
                        if (!response.isErroneous()) {
                            scope.loadingModels = false;
                            scope.rawmodelsmenu = $filter('orderBy')(response.data, 'name');
                            updateDisplay(scope.rawmodelsmenu);
                        }
                    });
                };

                var resetNewModel = function() {
                    scope.newModel = {
                        name: '',
                        templateId: 0,
                        search: ''
                    };
                };

                var updateDisplay = function(list) {
                    scope.modelsmenu = list;
                };

                scope.cancelModel = function() {
                    resetNewModel();
                    scope.$emit('collapse');
                };


                scope.filterModels = function(search) {
                    if (search && search.length > 0) {
                        var needle = search.toLowerCase();
                        var filtered = [];
                        for (var i in scope.rawmodelsmenu) {
                            var mo = scope.rawmodelsmenu[i];
                            if (mo.name.toLowerCase().indexOf(needle) >= 0) {
                                filtered.push(mo);
                            }
                        }
                        updateDisplay(filtered);
                    } else {
                        updateDisplay(scope.rawmodelsmenu);
                    }
                };


                scope.createModel = function() {
                    var button = $(element).find(".form__submit");
                    if (scope.newModel.name !== '') {
                        if (scope.newModel.templateId !== 0) {
                            if (!button.hasClass("button--disable")) {
                                button.addClass("button--disable button--spinner button--rotate");
                                scope.modelerIndexCtrl.createModel(scope.newModel.name, scope.newModel.templateId).then(function() {
                                    button.removeClass("button--disable button--spinner button--rotate");
                                    resetNewModel();
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
                    resetNewModel();
                    loadModels();
                });
            }
        };
    })
    .directive('modelerModelsList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/directives.tmpl/list.html',
            scope: {
                models: '=',
                archive: '=',
                search: '=',
                duplicate: '=',
                duplicating: '=',
                user: '=',
                username: '=',
                mefirst: '='
            }
        };
    })
    .directive('modelCard', function() {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/directives.tmpl/card.html',
            scope: {
                model: '=',
                archive: '=',
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
