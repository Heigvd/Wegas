angular.module('autologin', [
    'wegas.models.sessions'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.autologin', {
                url: 'play/:token',
                views: {
                    'main@': {
                        controller: 'AutologinCtrl as autologinCtrl',
                        templateUrl: 'app/autologin/autologin.tmpl.html'
                    }
                }
            });
    })
    .controller('AutologinCtrl',
        function AutologinCtrl(Auth, Flash, $scope, $state, $stateParams, TeamsModel, SessionsModel, $translate) {
            "use strict";

            var errorRedirect = function(response) {
                response.flash();
                $state.go("wegas");
            },
                joinIndividualSession = function(session) {
                    TeamsModel.joinIndividually(session).then(function(response) {
                        if (!response.isErroneous()) {
                            window.location.href = window.ServiceURL + "game-play.html?gameId=" + session.id;
                        } else {
                            errorRedirect(response);
                        }
                    });
                };
            SessionsModel.findSessionToJoin($stateParams.token).then(function(responseToken) {
                if (!responseToken.isErroneous()) {
                    Auth.getAuthenticatedUser().then(function(user) {
                        var session;
                        if (user) {
                            session = responseToken.data;
                            TeamsModel.getTeamBySessionId(session.id).then(function(responseTeam) {
                                if (!responseTeam.isErroneous()) {
                                    window.location.href = window.ServiceURL + "game-play.html?gameId=" + session.id;
                                } else {
                                    if (session.properties.freeForAll) {
                                        joinIndividualSession(session);
                                    } else {
                                        $state.go("wegas.private.join", {'token': $stateParams.token});
                                    }
                                }
                            });
                        } else {
                            session = responseToken.data;
                            if (session.properties.guestAllowed) {

                                $translate('COMMONS-TEAMS-GUEST-JOINING').then(function(message) {
                                    $scope.message = message;
                                });

                                Auth.loginAsGuest().then(function(responseAuth) {
                                    if (!responseAuth.isErroneous()) {
                                        if (session.properties.freeForAll) {
                                            joinIndividualSession(session);
                                        } else {
                                            $state.go("wegas.private.join", {'token': $stateParams.token});
                                        }
                                    } else {
                                        errorRedirect(responseToken);
                                    }
                                });
                            } else {
                                window.location.href = window.ServiceURL + "?redirect=" + encodeURIComponent("#/play/" + session.token);
                            }
                        }
                    });
                } else {
                    errorRedirect(responseToken);
                }
            });
        }
    );
