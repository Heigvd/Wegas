angular.module('private.player.directives', [])
    .directive('playerIndex', function() {
        return {
            templateUrl: 'app/private/player/directives.tmpl/index.html',
            controller: 'PlayerController as playerCtrl'
        };
    }).controller("PlayerController", function PlayerController($rootScope, $state, $translate, TeamsModel, SessionsModel, Flash) {
        /* Assure access to ctrl. */
        var ctrl = this,

            /* Method used to update sessions. */
            updateTeams = function() {
                ctrl.loading = true;
                TeamsModel.getTeams().then(function(response) {
                    ctrl.loading = false;
                    if (!response.isErroneous()) {
                        ctrl.teams = response.data || [];
                    } else {
                        ctrl.teams = [];
                    }
                });
            };

        /* Container for datas. */
        ctrl.teams = []; 
        ctrl.loading = true;
        /* Method used to check token for adding a session. */
        ctrl.checkToken = function(token) {
            SessionsModel.findSessionToJoin(token).then(function(findResponse) {
                if (findResponse.isErroneous()) {
                    $translate('PLAYER-JOIN-TEAM-KEY-FLASH-ERROR').then(function (message) {
                        Flash.danger(message);
                    });
                } else {
                    if (findResponse.data.access != "CLOSE") {
                        var alreadyJoin = false;
                        ctrl.teams.forEach(function(team){
                            if(team.gameId == findResponse.data.id){
                                alreadyJoin = true;
                            }
                        });
                        if(alreadyJoin){
                            $translate('COMMONS-TEAMS-ALREADY-JOIN-FLASH-INFO').then(function (message) {
                                Flash.info(message);
                            });
                        }else{
                            if (findResponse.data.properties.freeForAll) {
                                TeamsModel.joinIndividually(findResponse.data).then(function(joinResponse) {
                                    if (!joinResponse.isErroneous()) {
                                        updateTeams();
                                    } else {
                                        joinResponse.flash();
                                    }
                                });
                            } else {
                                $state.go('wegas.private.player.join', {
                                    token: findResponse.data.token
                                });
                            }
                        }
                    } else {
                        $translate('COMMONS-SESSIONS-CLOSE-FLASH-ERROR').then(function (message) {
                            Flash.danger(message);
                        });
                    }
                }
            });
        };
        /* Leave the team */
        ctrl.leaveTeam = function(teamId) {
            TeamsModel.leaveTeam(teamId).then(function(response) {
                if (!response.isErroneous()) {
                    updateTeams();
                } else {
                    response.flash();
                }
            });
        }

        /* Listen for new session */
        $rootScope.$on('newTeam', function(e, hasNewData) {
            if (hasNewData) {
                updateTeams();
            }
        });

        /* Initialize datas */
        updateTeams();
    })
    .directive('playerJoinForm', function() {
        return {
            templateUrl: 'app/private/player/directives.tmpl/join-form.html',
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
                    scope.sessionToJoin = {
                        token: ""
                    };
                };
            }
        };
    })
    .directive('playerTeamsList', function() {
        return {
            templateUrl: 'app/private/player/directives.tmpl/list.html',
            scope: {
                teams: "=",
                leave: "=",
                loading: "="
            }
        };
    })
    .directive('playerTeamCard', function() {
        return {
            templateUrl: 'app/private/player/directives.tmpl/card.html',
            scope: {
                team: "=",
                leave: "="
            },
            link: function(scope, element, attrs) {
                scope.ServiceURL = ServiceURL;
                scope.MAX_DISPLAYED_CHARS = MAX_DISPLAYED_CHARS;
            }
        };
    });