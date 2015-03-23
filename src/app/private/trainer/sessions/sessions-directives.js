angular.module('private.trainer.sessions.directives', [
])
.directive('trainerSessionsIndex', function(SessionsModel){
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/sessions-index.tmpl.html',
    controller : function(){
        var ctrl = this;
        ctrl.search = "";
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
.directive('trainerSessionsAddTool', function(ScenariosModel, SessionsModel) {
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/sessions-add-tool.tmpl.html',
    scope: false, 
    require: "^trainerSessionsIndex",
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
.directive('trainerSessionsList', function() {
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/sessions-list.tmpl.html',
    scope: false,
    require: "^trainerSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        scope.$watch(function(){
            return parentCtrl.sessions
        }, function(newSessions, oldSessions){
            scope.sessions = newSessions;
        });
        scope.$watch(function(){
            return parentCtrl.search
        }, function(newSearch, oldSearch){
            scope.search = newSearch;
            console.log(scope.search);
        });

    }
  };
})
.directive('trainerSession', function() {
    return {
        templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/session-card-flat.tmpl.html',
        restrict: 'A',
        scope: {
           session: '='
        },
        link : function(scope, element, attrs){
            scope.editingName = false;
            scope.toogleEditingName = function(){
                console.log(element);
                scope.editingName = (!scope.editingName);
                $(element['context']).find(".titre__edition__input", function(elem){
                    console.log("hello");
                    console.log(elem);
                });
                console.log(scope.session.name);
            };
        }
    }
});