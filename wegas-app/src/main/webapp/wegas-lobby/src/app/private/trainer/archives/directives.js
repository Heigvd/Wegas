angular.module('private.trainer.archives.directives', [])
    .directive('trainerSessionsArchivesIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/archives/directives.tmpl/index.html',
            controller: "TrainerArchivesIndexController as trainerArchivesIndexController"
        };
    }).controller("TrainerArchivesIndexController", function TrainerArchivesIndexController($timeout, $rootScope, $scope, $state, SessionsModel, Flash) {
        var ctrl = this;
        ctrl.archives = [];
        ctrl.search = "";

        ctrl.updateSessions = function() {
            SessionsModel.getSessions("BIN").then(function(response) {
                ctrl.archives = response.data || {};
                if (response.isErroneous()) {
                    response.flash();
                }
                if (ctrl.archives.length == 0) {
                    $scope.close();
                }
            });
        };

        ctrl.unarchiveSession = function(sessionToUnarchive) {
            if (sessionToUnarchive) {
                SessionsModel.unarchiveSession(sessionToUnarchive).then(function(response) {
                    if (!response.isErroneous()) {
                        $rootScope.$emit('changeArchives', true);
                        ctrl.updateSessions();
                    }else{
                        response.flash();
                    }
                });
            } else {
                Flash.danger("No scenario choosed");
            }
        };

        ctrl.deleteArchivedSession = function(sessionToDelete) {
            if (sessionToDelete) {
                SessionsModel.deleteArchivedSession(sessionToDelete).then(function(response) {
                    if (!response.isErroneous()) {
                        $rootScope.$emit('changeArchives', true);
                        ctrl.updateSessions();
                    }else{
                        response.flash();
                    }
                });
            } else {
                Flash.danger("No session choosed");
            }
        };

        ctrl.showSettings = function(session) {
            if (session) {
                $scope.close();
                $timeout(function() {
                    $state.go('wegas.private.trainer.archives.settings', {id: session.id});
                }, 1500);
            } else {
                Flash.danger("No session choosed");
            }
        };

        ctrl.showUsers = function(session) {
            if (session) {
                $scope.close();
                $timeout(function() {
                    $state.go('wegas.private.trainer.archives.users', {id: session.id});
                }, 1500);
            } else {
                Flash.danger("No session choosed");
            }
        };

        /* Listen for new session */
        $rootScope.$on('changeArchives', function(e, hasNewData) {
            if (hasNewData) {
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
                unarchive: "=",
                search: "=",
                details: "=",
                users: "="
            },
            templateUrl: 'app/private/trainer/archives/directives.tmpl/list.html',
            link: function(scope, elem, attrs){
                scope.MAX_DISPLAYED_CHARS = MAX_DISPLAYED_CHARS;
            }
        };
    });