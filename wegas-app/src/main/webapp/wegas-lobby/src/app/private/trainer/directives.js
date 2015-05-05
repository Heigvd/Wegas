angular.module('private.trainer.directives', [
    'wegas.behaviours.repeat.autoload'
])
.directive('trainerSessionsIndex', function(){
  return {
    templateUrl: 'app/private/trainer/directives.tmpl/index.html',
    controller : "TrainerIndexController as trainerIndexCtrl"
  };
})
.controller("TrainerIndexController", function TrainerIndexController($rootScope, $scope, SessionsModel, Flash){
    var ctrl = this,
        initMaxSessionsDisplayed = function(){
            if(ctrl.sessions.length > 12){
                ctrl.maxSessionsDisplayed = 10;
            }else{
                ctrl.maxSessionsDisplayed = ctrl.sessions.length;
            }
        },
        updateDisplaySessions = function(){
            if(ctrl.maxSessionsDisplayed == null){
                initMaxSessionsDisplayed();
            }else{
                if(ctrl.maxSessionsDisplayed >= ctrl.sessions.length){
                    ctrl.maxSessionsDisplayed = ctrl.sessions.length;
                }else{
                    ctrl.maxSessionsDisplayed = ctrl.maxSessionsDisplayed + 5;
                }
            }
        };
        ctrl.loading = {
            sessions :true,
            archives : true,
            all: true
        };
        ctrl.search = "";
        $rootScope.$on("changeSearch", function(e, newSearch){
            ctrl.search = newSearch;
        });
        $scope.$watch(function(){
            return ctrl.search;
        }, function(newSearch){
            $rootScope.search = newSearch;
        });

        ctrl.sessions = [];
        ctrl.archives = [];
        ctrl.maxSessionsDisplayed = null;

    ctrl.updateSessions = function(updateDisplay){
        ctrl.sessions = [];
        ctrl.loading = {
            sessions :true,
            archives : true,
            all: true
        };
        SessionsModel.getSessions("managed").then(function(response){
            ctrl.loading.sessions = false;
            if(ctrl.loading.archives){
                ctrl.loading.all = false;
            }
            ctrl.sessions = response.data || [];
            if(updateDisplay){
                updateDisplaySessions();
            }
        });
        SessionsModel.getSessions("archived").then(function(response){
            ctrl.loading.archives = false;
            if(ctrl.loading.sessions){
                ctrl.loading.all = false;
            }
            ctrl.archives = response.data || [];
        });
    };

    ctrl.editAccess = function(sessionToSet){
        SessionsModel.updateAccessSession(sessionToSet).then(function(response){
            if(!response.isErroneous()){
                ctrl.updateSessions();
            }else{
                response.flash();
            }
        });
    };

    ctrl.archiveSession = function(sessionToArchive){
        if(sessionToArchive){
            SessionsModel.archiveSession(sessionToArchive).then(function(response){
                if(!response.isErroneous()){
                    ctrl.updateSessions();
                    $rootScope.$emit('changeArchives', true);
                }else{
                    response.flash();
                }
            });
        }else{
            Flash.danger("No scenario choosed");
        }
    };

    $rootScope.$on('changeArchives', function(e, hasNewData){
        if(hasNewData){
            SessionsModel.getSessions("archived").then(function(response){
                ctrl.archives = response.data || [];
            });
        }
    });
    $rootScope.$on('changeSessions', function(e, hasNewData){
        if(hasNewData){
            SessionsModel.getSessions("managed").then(function(response){
                ctrl.sessions = response.data || [];
            });
        }
    });
    $rootScope.$on('changeLimit', function(e, hasNewData) {
        if (hasNewData) {
            ctrl.updateSessions(true);
        }
    });

    /* Request data. */
    ctrl.updateSessions(true);

})
.directive('trainerSessionsAdd', function(ScenariosModel, SessionsModel, Flash) {
  return {
    templateUrl: 'app/private/trainer/directives.tmpl/add-form.html',
    scope: false,
    require: "^trainerSessionsIndex",
    link : function(scope, element, attrs, parentCtrl){
        ScenariosModel.getScenarios("LIVE").then(function(response){
            if(!response.isErroneous()){
                scope.scenarios = response.data;
            }else{
                Flash.danger("Error loading scenarios")
            }
        });
        scope.newSession = {
            name : "",
            scenarioId : 0
        };
        scope.addSession = function(){
            if(scope.newSession.scenarioId != 0){
                SessionsModel.createSession(scope.newSession.name, scope.newSession.scenarioId).then(function(response){
                    response.flash();
                    if(!response.isErroneous()){
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
    templateUrl: 'app/private/trainer/directives.tmpl/list.html',
    scope: {
        sessions : "=",
        search : "=",
        archive : "=",
        editAccess: "=",
        maximum:"="
    }
  };
})
.directive('trainerSession', function(Flash) {
    return {
        templateUrl: 'app/private/trainer/directives.tmpl/card.html',
        scope: {
           session: '=',
           archive: "=",
           editAccess: "="
        },
        link : function(scope, element, attrs){
            // Public parameters
            scope.open = false;
            if(scope.session.access !== "CLOSE"){
                scope.open = true;
            }
            scope.ServiceURL = ServiceURL;
            scope.MAX_DISPLAYED_CHARS = MAX_DISPLAYED_CHARS;
        }
    }
});