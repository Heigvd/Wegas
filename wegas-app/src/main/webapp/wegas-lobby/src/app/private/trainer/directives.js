angular.module('private.trainer.directives', [])
    .directive('trainerSessionsIndex', function(Auth) {
        "use strict";
        return {
            templateUrl: 'app/private/trainer/directives.tmpl/index.html',
            controller: "TrainerIndexController as trainerIndexCtrl"
        }
    })
    .controller("TrainerIndexController", function TrainerIndexController($rootScope, $scope, $translate, SessionsModel, Flash, $timeout, $filter) {
        "use strict";
        var ctrl = this;
        $rootScope.currentRole = "TRAINER";
        ctrl.loading = true;
        ctrl.search = "";
        ctrl.rawSessions = [];
        ctrl.sessions = [];
        ctrl.nbArchives = 0;
        //ctrl.scenariomenu = [];

        /*
        ** Filters ctrl.rawSessions according to the given search string and puts the result in ctrl.sessions.
        ** Hypothesis: input array ctrl.rawSessions is already ordered according to the 'createdTime' attribute,
        ** so that the output automatically follows the same ordering.
         */
        ctrl.filterSessions = function(search){
            if (!search || search.length === 0){
                ctrl.sessions = ctrl.rawSessions;
                return;
            }
            var res = [],
                len = ctrl.rawSessions.length,
                i;
            for (i=0; i<len; i++){
                var session = ctrl.rawSessions[i];
                if (!session.gameModel || session.gameModel.canView === false) continue;
                var needle = search.toLowerCase();
                if ((session.name && session.name.toLowerCase().indexOf(needle) >= 0) ||
                    (session.createdByName && session.createdByName.toLowerCase().indexOf(needle) >= 0) ||
                    (session.gameModelName && session.gameModelName.toLowerCase().indexOf(needle) >= 0) ||
                    (session.gameModel.comments && session.gameModel.comments.toLowerCase().indexOf(needle) >= 0) ||
                    // If searching for a number, the id has to start with the given pattern:
                    session.id.toString().indexOf(needle) === 0 ||
                    session.gameModelId.toString().indexOf(needle) === 0){
                    res.push(session);
                }
            }
            ctrl.sessions = res; // $filter('limitTo')(res, 20);
            if (ctrl.search != search){
                ctrl.search = search;
            }
        };

        // Called when a session is modified, added or removed:
        ctrl.updateSessions = function(updateDisplay) {
            var hideScrollbarDuringInitialRender = (ctrl.rawSessions.length === 0);
            if (hideScrollbarDuringInitialRender) {
                $('#trainer-sessions-list').css('overflow-y', 'hidden');
            }
            ctrl.sessions = ctrl.rawSessions = [];
            ctrl.loading = true;
            SessionsModel.getSessions("LIVE").then(function(response) {
                ctrl.loading = false;
                ctrl.rawSessions = $filter('orderBy')(response.data, 'createdTime', true) || [];
                // At this point, the search variable is not necessarily rendered nor updated by Angular to reflect the input field:
                var searchField = document.getElementById('searchField');
                if (searchField) {
                    ctrl.search = searchField.getElementsByClassName('tool__input')[0].value;
                }
                ctrl.filterSessions(ctrl.search);
                if (hideScrollbarDuringInitialRender) {
                    $timeout(function() {
                        $('#trainer-sessions-list').css('overflow-y', 'auto');
                    }, 5000);
                }
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

        $rootScope.$on('changeSessionsArchives', function(e, count) {
            ctrl.nbArchives += count;
        });

        $rootScope.$on('changeSessions', function(e, hasNewData) {
            if (hasNewData) {
                SessionsModel.getSessions("LIVE").then(function(response) {
                    ctrl.updateSessions(true);
                });
            }
        });

        ctrl.updateSessions(true);

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
                scope.loadingScenarios = false;
                var loadScenarios = function() {
                    if (scope.scenariomenu.length == 0) {
                        scope.loadingScenarios = true;
                        ScenariosModel.getScenarios("LIVE").then(function(response) {
                            if (!response.isErroneous()) {
                                scope.loadingScenarios = false;
                                var expression = { canInstantiate: true },
                                    filtered = $filter('filter')(response.data, expression) || [];
                                scope.scenariomenu = $filter('orderBy')(filtered, 'name');
                            }
                        });
                    }
                };
                var resetNewSession = function() {
                    scope.newSession = {
                        name: "",
                        scenarioId: 0
                    };
                };

                scope.cancelAddSession = function() {
                    resetNewSession();
                    scope.$emit('collapse');
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

                scope.$on('expand', function() {
                    resetNewSession();
                    loadScenarios();
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
                // maximum: "=",
                filterSessions: "="
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
                editAccess: "="
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
