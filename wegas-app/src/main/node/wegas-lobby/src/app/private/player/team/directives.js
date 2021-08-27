angular.module('private.player.team.directives', [])
    .directive('playerTeamIndex', function() {
        "use strict";
        return {
            templateUrl: 'app/private/player/team/directives.tmpl/index.html',
            scope: {
                close: "&"
            },
            controller: 'PlayerTeamController as playerTeamCtrl'
        };
    })
    .controller('PlayerTeamController', function PlayerTeamController($scope, $state, $interval, $stateParams, Auth, TeamsModel) {
        "use strict";
        /* Ensure access to ctrl. */
        var ctrl = this;
        /* Container for datas */
        ctrl.team = {};
        ctrl.user = {};
        ctrl.refreshing = -1;
        /* Initialize datas */
        Auth.getAuthenticatedUser().then(function(user) {
            ctrl.user = user;
            if (user !== null) {
                TeamsModel.getTeam($stateParams.id).then(function(response) {
                    if (response.isErroneous()) {
                        $scope.close();
                    } else {
                        if (!response.data.gameFreeForAll) {
                            ctrl.team = response.data;
                            ctrl.refreshTeam();
                        } else {
                            $scope.close();
                        }
                    }
                });
            } else {
                $scope.close();
            }
        });
        ctrl.refreshTeam = function() {
            ctrl.refreshing = 1;
            TeamsModel.refreshTeam(ctrl.team).then(function(response) {
                var refreshingTimer;
                if (!response.isErroneous()) {
                    refreshingTimer = $interval(function() {
                        $interval.cancel(refreshingTimer);
                        ctrl.refreshing = 0;
                        refreshingTimer = $interval(function() {
                            $interval.cancel(refreshingTimer);
                            ctrl.refreshing = -1;
                        }, 1200);
                    }, 500);
                    ctrl.team = response.data;
                } else {
                    refreshingTimer = $interval(function() {
                        $interval.cancel(refreshingTimer);
                        ctrl.refreshing = -1;
                    }, 1200);
                    response.flash();
                }
            });
        };
    })
    .directive('playerTeamPlayersList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/player/team/directives.tmpl/players-list.html',
            scope: {
                players: "="
            }
        };
    });
