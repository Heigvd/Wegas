angular.module('private.trainer.directives', [
    'wegas.behaviours.repeat.autoload',
    'ngClipboard'
])
    .config(['ngClipProvider', function(ngClipProvider) {
        ngClipProvider.setPath("wegas-lobby/bower_components/zeroclipboard/dist/ZeroClipboard.swf");
    }])
    .directive('trainerSessionsIndex', function() {
        return {
            templateUrl: 'app/private/trainer/directives.tmpl/index.html',
            controller: "TrainerIndexController as trainerIndexCtrl"
        };
    })
    .controller("TrainerIndexController", function TrainerIndexController($rootScope, $scope, $translate, SessionsModel, Flash) {
        var ctrl = this,
            initMaxSessionsDisplayed = function() {
                if (ctrl.sessions.length > 12) {
                    ctrl.maxSessionsDisplayed = 10;
                } else {
                    ctrl.maxSessionsDisplayed = ctrl.sessions.length;
                }
            },
            updateDisplaySessions = function() {
                if (ctrl.maxSessionsDisplayed == null) {
                    initMaxSessionsDisplayed();
                } else {
                    if (ctrl.maxSessionsDisplayed >= ctrl.sessions.length) {
                        ctrl.maxSessionsDisplayed = ctrl.sessions.length;
                    } else {
                        ctrl.maxSessionsDisplayed = ctrl.maxSessionsDisplayed + 5;
                    }
                }
            };
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
            if(!updateDisplay){
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
            if (sessionToArchive) {
                SessionsModel.archiveSession(sessionToArchive).then(function(response) {
                    if (!response.isErroneous()) {
                        ctrl.updateSessions();
                        $rootScope.$emit('changeArchives', true);
                    } else {
                        response.flash();
                    }
                });
            } else {
                $translate('COMMONS-SCENARIOS-NO-SCENARIO-FLASH-ERROR').then(function (message) {
                    Flash.danger(message);
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
        SessionsModel.countArchivedSessions().then(function(response) {
            ctrl.nbArchives = response.data;
        });
    })
    .directive('trainerSessionsAdd', function(ScenariosModel, SessionsModel, Flash, $translate) {
        return {
            templateUrl: 'app/private/trainer/directives.tmpl/add-form.html',
            scope: false,
            require: "^trainerSessionsIndex",
            link: function(scope, element, attrs, parentCtrl) {
                ScenariosModel.getScenarios("LIVE").then(function(response) {
                    if (!response.isErroneous()) {
                        scope.scenarios = response.data;
                    }
                });
                scope.newSession = {
                    name: "",
                    scenarioId: 0
                };
                scope.addSession = function() {
                    if (scope.newSession.scenarioId != 0) {
                        SessionsModel.createSession(scope.newSession.name, scope.newSession.scenarioId).then(function(response) {
                            if (!response.isErroneous()) {
                                scope.newSession = {
                                    name: "",
                                    scenarioId: 0
                                };
                                parentCtrl.updateSessions(true);
                            } else {
                                response.flash();
                            }
                        });
                    } else {
                        $translate('COMMONS-SCENARIOS-NO-SCENARIO-FLASH-ERROR').then(function (message) {
                            Flash.warning(message);
                        });
                    }
                };
            }
        };
    })
    .directive('trainerSessionsList', function() {
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
    .directive('trainerSession', function(ngClip, Flash) {
        return {
            templateUrl: 'app/private/trainer/directives.tmpl/card.html',
            scope: {
                session: '=',
                archive: "=",
                editAccess: "="
            },
            link: function(scope, element, attrs) {
                scope.fallback = function(copy) {
                    window.prompt('Press cmd+c to copy the text below.', copy);
                };
                
                scope.setTitleAfterCopy = function(){
                    console.log(attrs);
                };
                scope.open = true;
                console.log(scope.session.access);
                if (scope.session.access !== "OPEN") {
                    scope.open = false;
                }
                scope.ServiceURL = ServiceURL;
            }
        };
    })
    .directive('sessionAccessKey', function() {
        return function(scope, element, attrs) {
            var popup;
            $(element).on("click", function(e){
                popup.text("Copied");
            });
            $(element).on("mouseover", function(e){
                popup = $("<div>").addClass("key__popup");
                popup.text(attrs.clipTitle);
                $(element).append(popup);
            });
            $(element).on("mouseout", function(e){
                popup.remove();
            });
        };
    });