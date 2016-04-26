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
    .controller("TrainerIndexController", function TrainerIndexController($rootScope, $scope, $translate, SessionsModel, Flash, $timeout) {
        "use strict";
        var ctrl = this,
            initMaxSessionsDisplayed = function() {
                if (ctrl.sessions.length > 12) {
                    ctrl.maxSessionsDisplayed = 10;
                } else {
                    ctrl.maxSessionsDisplayed = ctrl.sessions.length;
                }
            },
            updateDisplaySessions = function() {
                if (ctrl.maxSessionsDisplayed === null) {
                    initMaxSessionsDisplayed();
                } else {
                    if (ctrl.maxSessionsDisplayed >= ctrl.sessions.length) {
                        ctrl.maxSessionsDisplayed = ctrl.sessions.length;
                    } else {
                        ctrl.maxSessionsDisplayed = ctrl.maxSessionsDisplayed + 5;
                    }
                }
            };
        $rootScope.currentRole = "TRAINER";
        ctrl.loading = true;
        ctrl.search = "";
        ctrl.sessions = [];
        ctrl.nbArchives = 0;
        ctrl.maxSessionsDisplayed = null;

        ctrl.updateSessions = function(updateDisplay) {
            ctrl.sessions = [];
            ctrl.loading = true;
            SessionsModel.getSessions("LIVE").then(function(response) {
                ctrl.loading = false;
                ctrl.sessions = response.data || [];
                if (updateDisplay) {
                    updateDisplaySessions();
                }
            });
            if (updateDisplay) {
                SessionsModel.countArchivedSessions().then(function(response) {
                    ctrl.nbArchives = response.data;
                });
            }
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
            $('#archive-'+sessionToArchive.id).removeClass('button--archive').addClass('busy-button');
            if (sessionToArchive) {
                SessionsModel.archiveSession(sessionToArchive).then(function(response) {
                    if (!response.isErroneous()) {
                        ctrl.updateSessions();
                        $rootScope.$emit('changeArchives', true);
                    } else {
                        response.flash();
                    }
                    $timeout(function(){
                        $('#archive-'+sessionToArchive.id).removeClass('busy-button').addClass('button--archive');
                    }, 500);
                });
            } else {
                $translate('COMMONS-SCENARIOS-NO-SCENARIO-FLASH-ERROR').then(function(message) {
                    Flash.danger(message);
                    $timeout(function(){
                        $('#archive-'+sessionToArchive.id).removeClass('busy-button').addClass('button--archive');
                    }, 500);
                });
            }
        };

        $rootScope.$on('changeArchives', function(e, hasNewData) {
            if (hasNewData) {
                SessionsModel.countArchivedSessions().then(function(response) {
                    ctrl.nbArchives = response.data;
                });
            }
        });

        $rootScope.$on('changeSessions', function(e, hasNewData) {
            if (hasNewData) {
                SessionsModel.getSessions("LIVE").then(function(response) {
                    ctrl.sessions = response.data || [];
                });
            }
        });

        $rootScope.$on('changeLimit', function(e, hasNewData) {
            if (hasNewData) {
                ctrl.updateSessions(true);
            }
        });

        /* Request data. */
        ctrl.updateSessions(true);
        /*
        // This is redundant with ctrl.updateSessions(true):
        SessionsModel.countArchivedSessions().then(function(response) {
            ctrl.nbArchives = response.data;
        });
        */
    })
    .directive('trainerSessionsAdd', function(ScenariosModel, SessionsModel, Flash, $translate) {
        "use strict";
        return {
            templateUrl: 'app/private/trainer/directives.tmpl/add-form.html',
            scope: false,
            require: "^trainerSessionsIndex",
            link: function(scope, element, attrs, parentCtrl) {
                scope.scenarios = [];
                scope.loadingScenarios = false;
                var loadScenarios = function() {
                    if (scope.scenarios.length==0) {
                        scope.loadingScenarios = true;
                        ScenariosModel.getScenarios("LIVE").then(function (response) {
                            if (!response.isErroneous()) {
                                scope.loadingScenarios = false;
                                scope.scenarios = response.data;
                            }
                        });
                    }
                };
                scope.newSession = {
                    name: "",
                    scenarioId: 0
                };

                scope.cancelAddSession = function() {
                    scope.newSession = {
                        name: "",
                        scenarioId: 0
                    };
                    scope.$emit('collapse');
                };

                scope.addSession = function() {
                    var button = $(element).find(".form__submit");
                    if (scope.newSession.name==""){
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
                                    scope.newSession = {
                                        name: "",
                                        scenarioId: 0
                                    };
                                    scope.$emit('collapse');
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
                maximum: "="
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
