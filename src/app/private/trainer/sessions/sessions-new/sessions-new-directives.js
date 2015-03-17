angular.module('trainer.sessions.new.directives', [
])
.directive('addSessionForm', function(ScenariosModel, SessionsModel) {
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-new/sessions-new-add-form.tmpl.html',
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
});