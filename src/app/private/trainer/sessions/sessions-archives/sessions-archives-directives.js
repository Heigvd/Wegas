angular.module('private.trainer.sessions.archives.directives', [])
    .directive('trainerSessionsArchivesIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/sessions/sessions-archives/sessions-archives-directives.tmpl/sessions-archives-index.tmpl.html',
            controller: "TrainerSessionsArchivesController as trainerSessionsArchivesCtrl"
        };
    }).controller("TrainerSessionsArchivesController", function TrainerSessionsArchivesController($rootScope, $scope, SessionsModel, Flash) {
        var ctrl = this;
        ctrl.archives = [];

        ctrl.updateSessions = function() {
            SessionsModel.getSessions("archived").then(function(response) {
                ctrl.archives = response.data || {};
                if (response.isErroneous()) {
                    response.flash();
                }
                if(ctrl.archives.length == 0){
                    $scope.close();
                }
            });
        };

        ctrl.unarchiveSession = function(sessionToUnarchive){
            if(sessionToUnarchive){
                SessionsModel.unarchiveSession(sessionToUnarchive).then(function(response){
                    response.flash();
                    if(!response.isErroneous()){
                        $rootScope.$emit('changeArchives', true);
                        ctrl.updateSessions();
                    }
                });
            }else{
                Flash.danger("No scenario choosed");
            }
        };

        ctrl.deleteArchivedSession = function(sessionToDelete){
            if(sessionToDelete){
                SessionsModel.deleteArchivedSession(sessionToDelete).then(function(response){
                    response.flash();
                    if(!response.isErroneous()){
                        $rootScope.$emit('changeArchives', true);
                        ctrl.updateSessions();
                    }
                });
            }else{
                Flash.danger("No scenario choosed");
            }
        };

        ctrl.deleteArchivedSessions = function(){
            if(ctrl.archives.length > 0){
                SessionsModel.deleteArchivedSessions().then(function(response){
                    response.flash();
                    if(!response.isErroneous()){
                        $rootScope.$emit('changeArchives', true);
                        ctrl.updateSessions();
                    }
                });
            }else{
                Flash.danger("No scenario archived");
            }
        };

        /* Listen for new session */
        $rootScope.$on('changeArchives', function(e, hasNewData){
            if(hasNewData){
                ctrl.updateSessions();
            }
        });

        ctrl.updateSessions();
    })
    .directive('trainerSessionsArchivesList', function() {
        return {
            scope: {
                sessions: "=",
                delete: "=",
                unarchive: "="
            },
            templateUrl: 'app/private/trainer/sessions/sessions-archives/sessions-archives-directives.tmpl/sessions-archives-list.tmpl.html'
        };
    })
    ;