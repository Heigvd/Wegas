angular.module('private.player.sessions.directives', [])
    .directive('playerSessionsIndex', function() {
        return {
            templateUrl: 'app/private/player/sessions/directives.tmpl/index.html',
            controller: 'PlayerSessionsController as playerSessionsCtrl'
        };
    }).controller("PlayerSessionsController", function PlayerSessionsIndexController($rootScope, $state, SessionsModel, Flash) {
        /* Assure access to ctrl. */
        var ctrl = this,

            /* Method used to update sessions. */
            updateSessions = function() {
                SessionsModel.getSessions("played").then(function(response) {
                    if (!response.isErroneous()) {
                        ctrl.sessions = response.data;
                    } else {
                        ctrl.sessions = [];
                    }
                });
            };

        /* Container for datas. */
        ctrl.sessions = [];

        /* Method used to check token for adding a session. */
        ctrl.checkToken = function(token) {
            SessionsModel.findSessionToJoin(token).then(function(findResponse) {
                if (findResponse.isErroneous()) {
                    findResponse.flash();
                } else {
                    if (findResponse.data.properties.freeForAll) {
                        SessionsModel.joinIndividualSession(token).then(function(joinResponse) {
                            joinResponse.flash();
                            if (!joinResponse.isErroneous()) {
                                updateSessions();
                            }
                        });
                    } else {
                        $state.go('wegas.private.player.sessions.join', {
                            token: findResponse.data.token
                        });
                    }
                }
            });
        };
        /*  */
        ctrl.leaveSession = function(sessionId) {
            SessionsModel.leaveSession(sessionId).then(function(response) {
                response.flash();
                if (!response.isErroneous()) {
                    updateSessions();
                }
            });
        }

        /* Listen for new session */
        $rootScope.$on('newSession', function(e, hasNewData) {
            if (hasNewData) {
                updateSessions();
            }
        });

        /* Initialize datas */
        updateSessions();
    })
    .directive('playerSessionJoinForm', function() {
        return {
            templateUrl: 'app/private/player/sessions/directives.tmpl/join-form.html',
            scope: {
                checkToken: "="
            },
            link: function(scope, element, attrs) {
                // Link the token input
                scope.sessionToJoin = {
                    token: ""
                };

                // Use checkToken from index to join a new session.
                scope.joinSession = function() {
                    scope.checkToken(scope.sessionToJoin.token);
                };
            }
        };
    })
    .directive('playerSessionsList', function() {
        return {
            templateUrl: 'app/private/player/sessions/directives.tmpl/list.html',
            scope: {
                sessions: "=",
                leave: "="
            }
        };
    });