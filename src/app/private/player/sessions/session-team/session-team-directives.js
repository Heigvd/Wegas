angular.module('private.player.session.team.directives', [])
.directive('playerSessionTeamIndex', function(){
    return {
        templateUrl: 'app/private/player/sessions/session-team/session-team-directives.tmpl/session-team-index.tmpl.html',
        scope:{
            close: "&"
        },
        controller: 'PlayerSessionTeamController as playerSessionTeamCtrl'
    };
}).controller('PlayerSessionTeamController', function PlayerSessionTeamController($scope, $stateParams, SessionsModel){
    /* Assure access to ctrl. */
    var ctrl = this;

    /* Container for datas */
    ctrl.playedSession = {};

    /* Initialize datas */
    SessionsModel.getPlayedSession($stateParams.id).then(function(response){
        if(response.data){
            var session = response.data;
            if(!session.properties.freeForAll){
                ctrl.playedSession = session;
            }else{
                $scope.close();
            }
        }else{
            $scope.close();
        }
    });
});