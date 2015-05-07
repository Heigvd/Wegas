angular.module('private.player.team.directives', [])
    .directive('playerSessionTeamIndex', function() {
        return {
            templateUrl: 'app/private/player/team/directives.tmpl/index.html',
            scope: {
                close: "&"
            },
            controller: 'PlayerSessionTeamController as playerSessionTeamCtrl'
        };
    }).controller('PlayerSessionTeamController', function PlayerSessionTeamController($scope, $state, $stateParams, Auth, SessionsModel) {
        /* Assure access to ctrl. */
        var ctrl = this;
        /* Container for datas */
        ctrl.team = {};
        ctrl.user = {};
        ctrl.session = "";
        /* Initialize datas */
        Auth.getAuthenticatedUser().then(function(user) {
            ctrl.user = user;
            if (user !== null) {
                SessionsModel.getSession("played", $stateParams.id).then(function(response) {
                    if (response.isErroneous()) {
                        $scope.close();
                    } else {
                        if (!response.data.properties.freeForAll) {
                            ctrl.session = response.data;
                            response.data.teams.forEach(function(team) {
                                team.players.forEach(function(player) {
                                    if (ctrl.user.id == player.userId) {
                                        ctrl.team = team;
                                    }
                                });
                            });
                        } else {
                            $scope.close();
                        }
                    }
                });
            } else {
                $scope.close();
            }
        });
        ctrl.refreshSession = function () {
            SessionsModel.refreshSession("played", ctrl.session).then(function(response) {
                if (!response.isErroneous()) {
                    ctrl.session = response.data;
                    response.data.teams.forEach(function(team) {
                        team.players.forEach(function(player) {
                            if (ctrl.user.id == player.userId) {
                                ctrl.team = team;
                            }
                        });
                    });
                } else {
                    response.flash();
                }
            });
        };
    }).directive('playerSessionTeamPlayersList', function() {
        return {
            templateUrl: 'app/private/player/team/directives.tmpl/players-list.html',
            scope: {
                players: "="
            }
        };
    });