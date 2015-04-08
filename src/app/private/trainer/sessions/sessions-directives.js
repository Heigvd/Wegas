angular.module('private.trainer.sessions.directives', [
])
.directive('trainerSessionsIndex', function(SessionsModel, Flash){
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/sessions-index.tmpl.html',
    controller : function(){
        var ctrl = this;
        ctrl.search = "";
        ctrl.sessions = [];
        SessionsModel.getManagedSessions().then(function(response){
            ctrl.sessions = response.data || [];
        });
        ctrl.updateSessions = function(){
            SessionsModel.getManagedSessions().then(function(response){
                ctrl.sessions = response.data || [];
            });
        };
        ctrl.editName = function(sessionToSet){
            SessionsModel.updateNameSession(sessionToSet).then(function(response){
                Flash(response.level, response.message);
                if(response.data){
                    ctrl.updateSessions();
                }
            });
        };
        ctrl.editComments = function(sessionToSet){
            SessionsModel.updateCommentsSession(sessionToSet).then(function(response){
                Flash(response.level, response.message);
                if(response.data){
                    ctrl.updateSessions();
                }
            });
        };
    }
  };
})
.directive('trainerSessionsAdd', function(ScenariosModel, SessionsModel, Flash) {
  return {
    templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/sessions-add-form.tmpl.html',
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
                SessionsModel.createManagedSession(scope.newSession.name, scope.newSession.scenarioId).then(function(response){
                    Flash(response.level, response.message);
                    if(response.data){
                        scope.newSession = {
                            name : "",
                            scenarioId : 0 
                        };
                        parentCtrl.updateSessions();
                    }
                });   
            }else{
                Flash.warning("No scenario choosed");
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
        templateUrl: 'app/private/trainer/sessions/sessions-directives.tmpl/session-card.tmpl.html',
        restrict: 'A',
        require: "^trainerSessionsIndex",
        scope: {
           session: '='
        },
        link : function(scope, element, attrs, parentCtrl){
            // Private function 
            var resetSessionToSet = function(){
                scope.sessionToSet = {
                    id: scope.session.id,
                    name: scope.session.name,
                    comments: scope.session.gameModel.comments
                };
            }

            // Public parameters
            scope.editingName = false;
            scope.editingComments = false;
            resetSessionToSet();

            // Public function 
            scope.toogleEditingName = function(){
                if(scope.editingComments){
                    scope.toogleEditingComments();
                }
                scope.editingName = (!scope.editingName);
                resetSessionToSet();
            };
            
            // Public function 
            scope.editName = function(){
                parentCtrl.editName(scope.sessionToSet);
                scope.toogleEditingName();
            };
            
            // Public function 
            scope.toogleEditingComments = function(){
                if(scope.editingName){
                    scope.toogleEditingName();
                }
                scope.editingComments = (!scope.editingComments);
                resetSessionToSet();
            };
            
            // Public function 
            scope.editComments = function(){
                parentCtrl.editComments(scope.sessionToSet);
                scope.toogleEditingComments();
            };

            scope.archive = function(){
                console.log("ARCHIVE, BIM!");
            }
        }
    }
});