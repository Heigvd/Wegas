angular.module('private.player.session.join.directives', [])
.directive('playerSessionJoinIndex', function(){
    return {
        templateUrl: 'app/private/player/sessions/session-join/session-join-directives.tmpl/session-join-index.tmpl.html',
        scope:{
            close: "&"
        },
        controller: 'PlayerSessionJoinController as playerSessionJoinCtrl'
    };
}).controller('PlayerSessionJoinController', function PlayerSessionJoinController($rootScope, $scope, $stateParams, SessionsModel){
    /* Assure access to ctrl. */
    var ctrl = this;

    /* Container for datas */
    ctrl.sessionToJoin = {};

    /* Method used to create new team and join this new team in the session. */
    ctrl.createAndJoinTeam = function(teamName){
        SessionsModel.createTeam(ctrl.sessionToJoin.id, teamName).then(function(data){
            SessionsModel.joinTeam(ctrl.sessionToJoin.id, data.id).then(function(sessionUpdated){
                if(sessionUpdated){
                    $rootScope.$emit('newSession', true);
                    $scope.close();
                }
            });
        });
    };

    /* Method used to join existing team in the session. */
    ctrl.joinTeam = function(teamId){
        SessionsModel.joinTeam(ctrl.sessionToJoin.id, teamId).then(function(sessionUpdated){
            if(sessionUpdated){
                $rootScope.$emit('newSession', true);
                $scope.close();
            }
        });
    };

    /* Initialize datas */
    SessionsModel.findSessionToJoin($stateParams.token).then(function(session){
        if(session){
            if(!session.properties.freeForAll){
                ctrl.sessionToJoin = session;
            }else{
                $scope.close();
            }
        }else{
            $scope.close();
        }
    });
})
.directive('playerSessionJoinTeam', function(){
    return {
        templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/session-join-team.tmpl.html',
        scope: {
            createAndJoinTeam: "="    
        }
    };
})
.directive('playerSessionTeamsList', function() {
  return {
    templateUrl: 'app/private/player/sessions/session-join/session-join-directives.tmpl/session-join-teams-list.tmpl.html',
    scope: {
        teams : "=",
        joinTeam : "="
    }
  };
});