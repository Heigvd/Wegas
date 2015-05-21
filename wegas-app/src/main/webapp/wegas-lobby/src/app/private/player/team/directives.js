angular.module('private.player.team.directives', [])
    .directive('playerTeamIndex', function() {
        return {
            templateUrl: 'app/private/player/team/directives.tmpl/index.html',
            scope: {
                close: "&"
            },
            controller: 'PlayerTeamController as playerTeamCtrl'
        };
    }).controller('PlayerTeamController', function PlayerTeamController($scope, $state, $stateParams, Auth, TeamsModel) {
        /* Assure access to ctrl. */
        var ctrl = this;
        /* Container for datas */
        ctrl.team = {};
        ctrl.user = {};
        /* Initialize datas */
        Auth.getAuthenticatedUser().then(function(user) {
            ctrl.user = user;
            if (user !== null) {
                TeamsModel.getTeam($stateParams.id).then(function(response) {
                    console.log(response);
                    if (response.isErroneous()) {
                        $scope.close();
                    } else {
                        if (!response.data.gameFreeForAll) {
                            ctrl.team = response.data;
                        } else {
                            $scope.close();
                        }
                    }
                });
            } else {
                $scope.close();
            }
        });
        ctrl.refreshTeam = function () {
            TeamsModel.refreshTeam(ctrl.team).then(function(response) {
                console.log(response);
                if (!response.isErroneous()) {
                    ctrl.team = response.data;
                } else {
                    response.flash();
                }
            });
        };
    }).directive('playerTeamPlayersList', function() {
        return {
            templateUrl: 'app/private/player/team/directives.tmpl/players-list.html',
            scope: {
                players: "="
            }
        };
    });