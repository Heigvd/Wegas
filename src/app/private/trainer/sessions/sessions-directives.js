angular.module('private.trainer.sessions.directives', [
])
.directive('managedSessionsIndex', function(SessionsModel){
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/sessions-index.tmpl.html',
    controller : function(){
        var ctrl = this;
        ctrl.sessions = [];
        SessionsModel.getManagedSessions().then(function(sessions){
            ctrl.sessions = sessions;
        });
        ctrl.updateSessions = function(){
            SessionsModel.getManagedSessions().then(function(sessions){
                ctrl.sessions = sessions;
            });
        }
    }
  };
})
.directive('managedSessionsAddForm', function(ScenariosModel, SessionsModel) {
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/sessions-add-form.tmpl.html',
    scope: false, 
    require: "^managedSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        ScenariosModel.getScenarios().then(function(scenarios){
            scope.scenarios = scenarios;
        });
        scope.newSession = {
            name : "",
            scenarioId : 0 
        };
        scope.addSession = function(){
            if(scope.newSession.scenarioId != 0){
                SessionsModel.createManagedSession(scope.newSession.name, scope.newSession.scenarioId).then(function(data){
                    scope.newSession = {
                        name : "",
                        scenarioId : 0 
                    };
                    parentCtrl.updateSessions();
                });   
            }else{
                console.log("Todo - Send error callback - Choose scenarios");
            }         
        };
    }
  };
})
.directive('managedSessionsList', function(ScenariosModel, SessionsModel) {
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/sessions-list.tmpl.html',
    scope: false,
    require: "^managedSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        scope.$watch(function(){
            return parentCtrl.sessions
        }, function(newSessions, oldSessions){
            scope.sessions = newSessions;
        });
    }
  };
});