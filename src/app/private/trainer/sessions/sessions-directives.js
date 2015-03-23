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
        };
        ctrl.editName = function(sessionToSet){
            SessionsModel.updateManagedSession(sessionToSet).then(function(data){
                ctrl.updateSessions();
            });
        };
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
        });

    }
  };
})
.directive('trainerSession', function() {
    return {
        templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/session-card-flat.tmpl.html',
        restrict: 'A',
        require: "^trainerSessionsIndex",
        scope: {
           session: '='
        },
        link : function(scope, element, attrs, parentCtrl){
            scope.editingName = false;
            scope.sessionToSet = {
                id: scope.session.id,
                name: scope.session.name
            };
            scope.toogleEditingName = function(){
                scope.editingName = (!scope.editingName);
                scope.sessionToSet = {
                    id: scope.session.id,
                    name: scope.session.name
                };
            };
            scope.editName = function(){
                console.log(scope.sessionToSet);
                parentCtrl.editName(scope.sessionToSet);
                scope.toogleEditingName();
            };

        }
    }
});