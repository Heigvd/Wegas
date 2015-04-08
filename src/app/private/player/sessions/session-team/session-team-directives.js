angular.module('private.player.session.team.directives', [])
.directive('playerSessionTeamIndex', function(){
    return {
        templateUrl: 'app/private/player/sessions/session-team/session-team-directives.tmpl/session-team-index.tmpl.html',
        scope:{
            close: "&"
        },
        controller: 'PlayerSessionTeamController as playerSessionTeamCtrl'
    };
}).controller('PlayerSessionTeamController', function PlayerSessionTeamController($scope, $state, $stateParams, Auth, SessionsModel){
    /* Assure access to ctrl. */
    var ctrl = this;
    /* Container for datas */
    ctrl.team = {};
    ctrl.sessionName = "";
    /* Initialize datas */
    Auth.getAuthenticatedUser().then(function(user){
        if(user !== null){
            SessionsModel.getPlayedSession($stateParams.id).then(function(response){
                if(response.isErroneous){
                    $scope.close();
                }else{
                    if(!response.data.properties.freeForAll){
                        ctrl.sessionName = response.data.name;
                        response.data.teams.forEach(function(team){
                            team.players.forEach(function(player){
                                if(user.id == player.userId){
                                    ctrl.team = team;
                                }
                            });
                        });
                    }else{
                        $scope.close();
                    }
                }
            });
        }else{
            $scope.close();
        }
    });
}).directive('playerSessionTeamPlayersList', function() {
  return {
    templateUrl: 'app/private/player/sessions/session-team/session-team-directives.tmpl/session-team-players-list.tmpl.html',
    scope: {
        players : "="
    }
  };
});