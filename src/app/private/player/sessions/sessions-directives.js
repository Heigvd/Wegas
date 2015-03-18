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

.directive('playerSessionJoin', function(ScenariosModel, SessionsModel) {
  return {
    templateUrl: 'app/private/player/sessions/sessions-directives.tmpl/session-join.tmpl.html',
    scope: false,
    require: "^playerSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
         scope.newSession = {
            token : ""
        };
        scope.joinSession = function(){
            // TODO
            alert('Sorry... Not yet implemented...');
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