angular.module('private.trainer.archives.directives', [])
    .directive('trainerSessionsArchivesIndex', function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/archives/directives.tmpl/index.html',
            controller: "TrainerArchivesIndexController as indexCtrl"
        };
    }).controller("TrainerArchivesIndexController", function TrainerArchivesIndexController($timeout, $translate, $rootScope, $scope, $state, SessionsModel, Flash) {
    "use strict";
    var ctrl = this;
    ctrl.archives = [];
    ctrl.search = "";
    ctrl.loading = true;

    ctrl.updateSessions = function() {
        ctrl.loading = true;
        SessionsModel.getSessions("BIN").then(function(response) {
            ctrl.loading = false;
            ctrl.archives = response.data || {};
            if (response.isErroneous()) {
                response.flash();
            }
            if (ctrl.archives.length === 0) {
                $scope.close();
            }
        });
    };

    ctrl.unarchiveSession = function(sessionToUnarchive) {
        if (sessionToUnarchive) {
            SessionsModel.unarchiveSession(sessionToUnarchive).then(function(response) {
                if (!response.isErroneous()) {
                    $rootScope.$emit('changeLimit', true);
                    $rootScope.$emit('changeSessionsArchives', -1);
                    ctrl.updateSessions();
                } else {
                    response.flash();
                }
            });
        } else {
            $translate('COMMONS-SESSIONS-NO-SESSION-FLASH-ERROR').then(function(message) {
                Flash.danger(message);
            });
        }
    };

    ctrl.deleteArchivedSession = function(sessionToDelete) {
        if (sessionToDelete) {
            SessionsModel.deleteArchivedSession(sessionToDelete).then(function(response) {
                if (!response.isErroneous()) {
                    $rootScope.$emit('changeLimit', true);
                    $rootScope.$emit('changeSessionsArchives', -1);
                    ctrl.updateSessions();
                } else {
                    response.flash();
                }
            });
        } else {
            $translate('COMMONS-SESSIONS-NO-SESSION-FLASH-ERROR').then(function(message) {
                Flash.danger(message);
            });
        }
    };

    ctrl.showSettings = function(session) {
        if (session) {
            $scope.close();
            $timeout(function() {
                $state.go('wegas.private.trainer.archives.settings', {
                    id: session.id
                });
            }, 1500);
        } else {
            $translate('COMMONS-SESSIONS-NO-SESSION-FLASH-ERROR').then(function(message) {
                Flash.danger(message);
            });
        }
    };

    ctrl.showUsers = function(session) {
        if (session) {
            $scope.close();
            $timeout(function() {
                $state.go('wegas.private.trainer.archives.users', {
                    id: session.id
                });
            }, 1500);
        } else {
            $translate('COMMONS-SESSIONS-NO-SESSION-FLASH-ERROR').then(function(message) {
                Flash.danger(message);
            });
        }
    };

    /* Listen for new session */
    /*$rootScope.$on('changeArchives', function(e, hasNewData) {
     if (hasNewData) {
     ctrl.updateSessions();
     }
     });*/

    ctrl.updateSessions();
})
    .directive('trainerSessionsArchivesList', function() {
        "use strict";
        return {
            scope: {
                sessions: "=",
                delete: "=",
                unarchive: "=",
                search: "=",
                details: "=",
                users: "=",
                loading: "="

            },
            templateUrl: 'app/private/trainer/archives/directives.tmpl/list.html'
        };
    });
