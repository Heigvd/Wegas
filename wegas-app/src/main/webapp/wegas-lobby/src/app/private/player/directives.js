angular.module('private.player.directives', [])
    .directive('playerIndex', function() {
        return {
            templateUrl: 'app/private/player/directives.tmpl/index.html',
            controller: 'PlayerController as playerCtrl'
        };
    }).controller("PlayerController", function PlayerController($rootScope, $state, TeamsModel, SessionsModel, Flash) {
        /* Assure access to ctrl. */
        var ctrl = this,

            /* Method used to update sessions. */
            updateTeams = function() {
                TeamsModel.getTeams().then(function(response) {
                    if (!response.isErroneous()) {
                        console.log(response.data);
                        ctrl.teams = response.data || [];
                    } else {
                        ctrl.teams = [];
                    }
                });
            };

        /* Container for datas. */
        ctrl.teams = []; 

        /* Method used to check token for adding a session. */
        ctrl.checkToken = function(token) {
            SessionsModel.findSessionToJoin(token).then(function(findResponse) {
                if (findResponse.isErroneous()) {
                    Flash.danger("This is not a valid access key");
                } else {
                    if (findResponse.data.access != "CLOSE") {
                        var alreadyJoin = false;
                        ctrl.teams.forEach(function(team){
                            if(team.gameId == findResponse.data.id){
                                alreadyJoin = true;
                            }
                        });
                        if(alreadyJoin){
                            Flash.info("You have already join this session");
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
                        Flash.danger("Session closed");
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
                leave: "="
            }
        };
    })
    .directive('playerTeamCard', function(Auth) {
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