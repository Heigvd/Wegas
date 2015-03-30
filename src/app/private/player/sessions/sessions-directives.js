angular.module('private.player.sessions.directives', [
])
.directive('playerSessionsIndex', function(SessionsModel){
  return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/sessions-index.tmpl.html',
    controller : function(){
        var ctrl = this;
        ctrl.sessions = [];
        SessionsModel.getPlayedSessions().then(function(sessions){
            ctrl.sessions = sessions;
        });
        ctrl.updateSessions = function(){
            SessionsModel.getPlayedSessions().then(function(sessions){
                ctrl.sessions = sessions;
            });
        }
    }
  };
})

.directive('playerSessionJoin', function($state, ScenariosModel, SessionsModel) {
  return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/session-join.tmpl.html',
    scope: false,
    require: "^playerSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        scope.sessionToJoin = {
            token : ""
        };
        scope.joinSession = function(){
            SessionsModel.findSessionToJoin(scope.sessionToJoin.token).then(function(session){
                if(session){
                    if(session.properties.freeForAll){
                        SessionsModel.joinSession(scope.sessionToJoin.token).then(function(data){
                            scope.sessionToJoin.token = "";
                            parentCtrl.updateSessions;
                        });
                    }else{
                        $state.go("wegas.private.player.sessions.join", {"id": session.id});
                    }
                }else{
                    console.log("Error - No session found");
                }
            });
        };
    }
  };
})
.directive('playerSessionsList', function(ScenariosModel, SessionsModel) {
  return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/sessions-list.tmpl.html',
    scope: false,
    require: "^playerSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        scope.$watch(function(){
            return parentCtrl.sessions
        }, function(newSessions, oldSessions){
            scope.sessions = newSessions;
        });
    }
  };
});