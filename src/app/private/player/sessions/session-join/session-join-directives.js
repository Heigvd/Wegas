angular.module('private.player.session.join.directives', [])
.directive('playerSessionJoinTeam', function(){
    return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/session-join-team.tmpl.html',
    scope: {
        
    },
    require: "^playerSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        scope.joinTeam = function(teamId){
            parentCtrl.joinTeam(teamId);
        }
        scope.createAndJoinTeam = function(teamName){
            parentCtrl.createAndJoinTeam(teamName);
        };

    }
  };
})
.directive('playerSessionTeamsList', function() {
  return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/session-teams.tmpl.html',
    scope: {
        sessionToJoin : "=",
        searchTeam : "="
    },
    require: "^playerSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        scope.joinTeam = function(teamId){
            parentCtrl.joinTeam(teamId);
        }
        scope.createAndJoinTeam = function(teamName){
            parentCtrl.createAndJoinTeam(teamName);
        };

    }
  };
});