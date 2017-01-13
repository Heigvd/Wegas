angular.module('private.player.directives', [])
    .directive('playerIndex', function() {
        "use strict";
        return {
            templateUrl: 'app/private/player/directives.tmpl/index.html',
            controller: 'PlayerController as playerCtrl'
        };
    }).controller("PlayerController",
    function PlayerController($q, $rootScope, $scope, $state, $translate, TeamsModel, SessionsModel, Flash, $timeout) {
        /* Assure access to ctrl. */
        "use strict";
        var ctrl = this,

            // Method used to update sessions:
            updateTeams = function() {
            var hideScrollbarDuringInitialRender = (ctrl.teams.length===0);
                if (hideScrollbarDuringInitialRender) {
                    $('#player-teams-list').css('overflow-y', 'hidden');
                }
                ctrl.loading = true;
                TeamsModel.getTeams().then(function(response) {
                    ctrl.loading = false;
                    if (!response.isErroneous()) {
                        ctrl.teams = response.data || [];
                    if (ctrl.teams.length<1) {
                            $scope.$emit('expand');
                        }
                    } else {
                        ctrl.teams = [];
                    }
                    if (hideScrollbarDuringInitialRender) {
                    $timeout(function () { $('#player-teams-list').css('overflow-y', 'auto'); }, 1000);
                    }
                });
            };

        $rootScope.currentRole = "PLAYER";
        /* Container for datas. */
        ctrl.teams = [];
        ctrl.loading = true;
        /* Method used to check token for adding a session. */
        ctrl.checkToken = function(token) {
            var deferred = $q.defer();
            SessionsModel.findSessionToJoin(token).then(function(findResponse) {
                if (findResponse.isErroneous()) {
                    $translate('PLAYER-JOIN-TEAM-KEY-FLASH-ERROR').then(function(message) {
                        Flash.danger(message);
                        deferred.resolve();
                    });
                } else {
                    if (findResponse.data.access !== "CLOSE") {
                        var alreadyJoin = false;
                        ctrl.teams.forEach(function(team) {
                            if (team.gameId === findResponse.data.id) {
                                alreadyJoin = true;
                            }
                        });
                        if (alreadyJoin) {
                            $translate('COMMONS-TEAMS-ALREADY-JOIN-FLASH-INFO').then(function(message) {
                                Flash.info(message);
                                deferred.resolve();
                            });
                        } else {
                            if (findResponse.data.properties.freeForAll) {
                                TeamsModel.joinIndividually(findResponse.data).then(function(joinResponse) {
                                    if (!joinResponse.isErroneous()) {
                                        $scope.$emit('collapse');
                                        updateTeams();
                                    } else {
                                        joinResponse.flash();
                                    }
                                    deferred.resolve();
                                });
                            } else {
                                $scope.$emit('collapse');
                                $state.go('wegas.private.join', {
                                    token: findResponse.data.token
                                });
                                deferred.resolve();
                            }
                        }
                    } else {
                        $translate('COMMONS-SESSIONS-CLOSE-FLASH-ERROR').then(function(message) {
                            Flash.danger(message);
                            deferred.resolve();
                        });
                    }
                }
            });
            return deferred.promise;
        };
        /* Leave the team */
        ctrl.leaveTeam = function(teamId) {
            $('#leave-'+teamId).removeClass('button--trash').addClass('busy-button');
            TeamsModel.leaveTeam(teamId).then(function(response) {
                $timeout(function(){
                    $('#leave-'+teamId).removeClass('busy-button').addClass('button--trash');
                }, 500);
                if (!response.isErroneous()) {
                    updateTeams();
                } else {
                    response.flash();
                }
            });
        };

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
        "use strict";
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
                    var button = $(element).find(".button--join-session");
                    if (!button.hasClass("button--disable")) {
                        button.addClass("button--disable button--spinner button--rotate");
                        scope.checkToken(scope.sessionToJoin.token).then(function() {
                            button.removeClass("button--disable button--spinner button--rotate");
                            scope.sessionToJoin = {
                                token: ""
                            };
                        });
                    }
                };
                scope.cancelJoin = function() {
                    scope.sessionToJoin = {
                        token: ""
                    };
                    scope.$emit('collapse');
                };

            }
        };
    })
    .directive('playerTeamsList', function() {
        "use strict";
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
        "use strict";
        return {
            templateUrl: 'app/private/player/directives.tmpl/card.html',
            scope: {
                team: "=",
                leave: "="
            },
            link: function(scope, element, attrs) {
                scope.ServiceURL = window.ServiceURL;
            }
        };
    });
