angular.module('private.trainer.directives', [
    'wegas.behaviours.repeat.autoload'
])
    .directive('trainerSessionsIndex', function(Auth) {
        "use strict";
        return {
            templateUrl: 'app/private/trainer/directives.tmpl/index.html',
            controller: "TrainerIndexController as trainerIndexCtrl"
        }
    })
    .controller("TrainerIndexController", function TrainerIndexController($rootScope, $scope, $window, $translate, SessionsModel, Flash, $timeout, $filter, Auth, UsersModel) {
        "use strict";
        var ctrl = this;
        $rootScope.currentRole = "TRAINER";
        ctrl.loading = true;
        ctrl.search = "";
        ctrl.sessions = [];
        ctrl.rawSessions = [];
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
                    // The number of sessions is low enough to display them entirely:
                    maxItemsDisplayed = len;
                }
            },
            // Returns the session list to be displayed now.
            currentList = function() {
                return isFiltering ? filtered : ctrl.rawSessions;
            },
            // Updates the display buffer (ctrl.sessions) if needed.
            updateDisplay = function(source) {
                if (prevSource !== source || maxItemsDisplayed !== ctrl.sessions.length) {
                    ctrl.sessions = source.slice(0, maxItemsDisplayed);
                    prevSource = source;
                }
            },
            // Adds some sessions to the bottom of the display.
            extendDisplayedItems = function() {
                var list = currentList();
                if (maxItemsDisplayed === null) {
                    initMaxItemsDisplayed();
                } else {
                    maxItemsDisplayed = Math.min(maxItemsDisplayed + ITEMS_IN_NEXT_BATCHES, list.length);
                }
                updateDisplay(list);
            },
            // Returns an array containing the occurrences of 'needle' in ctrl.rawSessions:
            doSearch = function(needle) {
                var len = ctrl.rawSessions.length,
                    res = [];
                for (var i = 0; i < len; i++) {
                    var session = ctrl.rawSessions[i];
                    if ((session.name && session.name.toLowerCase().indexOf(needle) >= 0) ||
                        (session.createdByName && session.createdByName.toLowerCase().indexOf(needle) >= 0) ||
                        (session.gameModelName && session.gameModelName.toLowerCase().indexOf(needle) >= 0) ||
                        (session.gameModel.comments && session.gameModel.comments.toLowerCase().indexOf(needle) >= 0) ||
                        // If searching for a number, the id has to start with the given pattern:
                        session.id.toString().indexOf(needle) === 0 ||
                        session.gameModelId.toString().indexOf(needle) === 0) {
                        res.push(session);
                    }
                }
                return res;
            };

        /*
         ** Updates the listing when the user has clicked on the "My sessions first" checkbox,
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
            ctrl.updateSessions(updateDisplay);
        }

        // Updates the listing when the user has clicked on the "My sessions first" checkbox.
        ctrl.toggleMeFirst = function() {
            ctrl.setMeFirst(!ctrl.mefirst);
            var config = localStorage.getObject("wegas-config");
            config.commons.mySessionsFirst = ctrl.mefirst;
            localStorage.setObject("wegas-config", config);
        }

        ctrl.initMeFirst = function() {
            if (ctrl.user) {
                if (ctrl.user.isAdmin) {
                    if (ctrl.username.length > 0) {
                        // Load the "My sessions first" preference, defaulting to true:
                        var config = localStorage.getObject("wegas-config"),
                            mefirst = config.commons && config.commons.mySessionsFirst !== false;
                        ctrl.setMeFirst(mefirst, true);
                    } // else: ignore as long as required information is missing
                } else {
                    // Initialization for non-admin users:
                    ctrl.setMeFirst(false, true);
                }
            }
        }

        /*
         ** Filters ctrl.rawSessions according to the given search string and puts the result in ctrl.sessions.
         ** Hypotheses on input array ctrl.rawSessions:
         ** 1. It contains games with a non-null 'gameModel'.
         ** 2. It's already ordered according to the 'createdTime' attribute,
         **    so that the output automatically follows the same ordering.
         */
        ctrl.filterSessions = function(search) {
            if (!search || search.length === 0) {
                if (isFiltering) {
                    isFiltering = false;
                    initMaxItemsDisplayed(); // Reset since we are changing between searching and not searching
                }
                updateDisplay(ctrl.rawSessions);
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

        // Called when a session is modified, reordered, added or removed:
        ctrl.updateSessions = function(extendDisplay) {
            var hideScrollbarDuringInitialRender = (ctrl.rawSessions.length === 0);
            if (hideScrollbarDuringInitialRender) {
                $('#trainer-sessions-list').css('overflow-y', 'hidden');
            }
            ctrl.sessions = [];
            ctrl.rawSessions = [];
            ctrl.loading = true;
            SessionsModel.getSessions("LIVE").then(function(response) {
                ctrl.rawSessions = response.data;
                if (ctrl.mefirst && ctrl.username.length > 0) {
                    // Prepare a list where "my" sessions appear first (ordered by creation date, like the rest):
                    var mySessions = $filter('filter')(ctrl.rawSessions, {createdByName: ctrl.username}) || [],
                        otherSessions = $filter('filter')(ctrl.rawSessions, {createdByName: '!' + ctrl.username}) || [];
                    mySessions = $filter('orderBy')(mySessions, 'createdTime', true) || [];
                    otherSessions = $filter('orderBy')(otherSessions, 'createdTime', true) || [];
                    ctrl.rawSessions = mySessions.concat(otherSessions);
                } else {
                    ctrl.rawSessions = $filter('orderBy')(ctrl.rawSessions, 'createdTime', true) || [];
                }
                // At this point, the search variable is not necessarily updated by Angular to reflect the input field:
                var searchField = document.getElementById('searchField');
                if (searchField) {
                    ctrl.search = searchField.getElementsByClassName('tool__input')[0].value;
                }
                ctrl.filterSessions(ctrl.search);
                if (extendDisplay) {
                    extendDisplayedItems();
                }
                if (hideScrollbarDuringInitialRender) {
                    $timeout(function() {
                        $('#trainer-sessions-list').css('overflow-y', 'auto');
                    }, 5000);
                }
                // Keep the "loading" indicator on screen as long as possible:
                ctrl.loading = false;
            });
        };

        ctrl.editAccess = function(sessionToSet) {
            SessionsModel.updateAccessSession(sessionToSet).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.updateSessions();
                } else {
                    response.flash();
                }
            });
        };

        ctrl.archiveSession = function(sessionToArchive) {
            $('#archive-' + sessionToArchive.id).removeClass('button--archive').addClass('busy-button');
            if (sessionToArchive) {
                SessionsModel.archiveSession(sessionToArchive).then(function(response) {
                    if (!response.isErroneous()) {
                        ctrl.updateSessions();
                        $rootScope.$emit('changeSessionsArchives', 1);
                    } else {
                        response.flash();
                    }
                    $timeout(function() {
                        $('#archive-' + sessionToArchive.id).removeClass('busy-button').addClass('button--archive');
                    }, 500);
                });
            } else {
                $translate('COMMONS-SCENARIOS-NO-SCENARIO-FLASH-ERROR').then(function(message) {
                    Flash.danger(message);
                    $timeout(function() {
                        $('#archive-' + sessionToArchive.id).removeClass('busy-button').addClass('button--archive');
                    }, 500);
                });
            }
        };

        ctrl.handlers.changeSessionsArchives = $rootScope.$on('changeSessionsArchives', function(e, count) {
            ctrl.nbArchives += count;
        });

        // Listen for updates to individual scenarios or to the list of sessions:
        ctrl.handlers.changeSessions = $rootScope.$on('changeSessions', function(e, hasNewData) {
            if (hasNewData) {
                // To be on the safe side, also request an extension of displayed sessions (parameter 'true'):
                ctrl.updateSessions(true);
            }
        });

        // Listen for scroll down events and extend the set of visible items without rebuilding the whole list:
        ctrl.handlers.changeLimit = $rootScope.$on('changeLimit', function(e, hasNewData) {
            if (e.currentScope.currentRole === "TRAINER") {
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

        SessionsModel.countArchivedSessions().then(function(response) {
            ctrl.nbArchives = response.data;
        });
    })
    .directive('trainerSessionsAdd', function(ScenariosModel, SessionsModel, Flash, $translate, $filter) {
        "use strict";
        return {
            templateUrl: 'app/private/trainer/directives.tmpl/add-form.html',
            scope: false,
            require: "^trainerSessionsIndex",
            link: function(scope, element, attrs, parentCtrl) {
                scope.scenariomenu = [];
                scope.rawscenariomenu = [];

                scope.loadingScenarios = false;

                var loadScenarios = function() {
                    if (scope.rawscenariomenu.length === 0) {
                        scope.loadingScenarios = true;

                        ScenariosModel.getGameModelsByStatusTypeAndPermission("SCENARIO", "LIVE", "INSTANTIATE").then(function(response){
                            if (!response.isErroneous()) {
                                scope.loadingScenarios = false;
                                scope.rawscenariomenu = $filter('orderBy')(response.data, 'name');
                                updateDisplay(scope.rawscenariomenu);
                            }
                        });
                    }
                };
                var resetNewSession = function() {
                    scope.newSession = {
                        name: "",
                        scenarioId: 0,
                        search: ''
                    };
                };

                scope.cancelAddSession = function() {
                    resetNewSession();
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



                scope.addSession = function() {
                    var button = $(element).find(".form__submit");
                    if (scope.newSession.name == "") {
                        $translate('COMMONS-SESSIONS-NO-NAME-FLASH-ERROR').then(function(message) {
                            Flash.warning(message);
                        });
                        return;
                    }
                    if (+scope.newSession.scenarioId !== 0) {
                        if (!button.hasClass("button--disable")) {
                            button.addClass("button--disable button--spinner button--rotate");
                            SessionsModel.createSession(scope.newSession.name, scope.newSession.scenarioId).then(function(response) {
                                if (!response.isErroneous()) {
                                    resetNewSession();
                                    scope.$emit('collapse');
                                    scope.search = "";
                                    parentCtrl.updateSessions(true);
                                    button.removeClass("button--disable button--spinner button--rotate");
                                } else {
                                    response.flash();
                                }
                            });
                        }
                    } else {
                        $translate('COMMONS-SCENARIOS-NO-SCENARIO-FLASH-ERROR').then(function(message) {
                            Flash.warning(message);
                        });
                    }
                };

                var onExpand = scope.$on('expand', function() {
                    resetNewSession();
                    loadScenarios();
                });

                scope.$on("$destroy", function() {
                    onExpand && onExpand();
                });
            }
        };
    })
    .directive('trainerSessionsList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/trainer/directives.tmpl/list.html',
            scope: {
                sessions: "=",
                search: "=",
                archive: "=",
                editAccess: "=",
                filterSessions: "=",
                user: '=',
                username: '=',
                mefirst: '='
            }
        };
    })
    .directive('trainerSession', function(Flash) {
        "use strict";
        return {
            templateUrl: 'app/private/trainer/directives.tmpl/card.html',
            scope: {
                session: '=',
                archive: "=",
                editAccess: "=",
                user: '=',
                username: '='
            },
            link: function(scope, element, attrs) {
                scope.open = true;
                if (scope.session.access !== "OPEN") {
                    scope.open = false;
                }
                scope.ServiceURL = window.ServiceURL;
            }
        };
    })
    ;
