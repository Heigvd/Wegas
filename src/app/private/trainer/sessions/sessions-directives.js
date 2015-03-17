angular.module('private.trainer.sessions.directives', [
])
.directive('sessionsAddForm', function(ScenariosModel, SessionsModel) {
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/sessions-add-form.tmpl.html',
    link : function(scope, element, attrs){
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
                });   
            }else{
                console.log("Todo - Send error callback - Choose scenarios");
            }         
        };
    }
  };
})
.directive('sessionsList', function(ScenariosModel, SessionsModel) {
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/sessions-list.tmpl.html',
    link : function(scope, element, attrs){
        SessionsModel.getManagedSessions().then(function(sessions){
            scope.sessions = sessions;
        });
    }
  };
});