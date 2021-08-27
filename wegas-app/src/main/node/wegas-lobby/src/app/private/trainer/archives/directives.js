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
    }).controller("TrainerArchivesIndexController", function TrainerArchivesIndexController($timeout, $translate, $rootScope, $scope, $state, SessionsModel, Flash, $filter, Auth, UsersModel) {
    "use strict";
    var ctrl = this;
    ctrl.archives = [];
    ctrl.rawArchives = [];
    ctrl.search = "";
    ctrl.loading = true;
    ctrl.username = '';


    /*
     ** Filters ctrl.rawArchives according to the given search string and puts the result in ctrl.archives.
     ** Hypothesis: input array ctrl.rawArchives is already ordered according to the 'createdTime' attribute,
     ** so that the output automatically follows the same ordering.
     */
    ctrl.filterArchives = function(search){
        if (!search || search.length === 0){
            ctrl.archives = ctrl.rawArchives;
            if ( ! $rootScope.$$phase) {
                $scope.$apply();
            }
            return;
        }
        var res = [],
            len = ctrl.rawArchives.length,
            i;
        for (i=0; i<len; i++){
            var session = ctrl.rawArchives[i];

            if (!session.gameModel || session.gameModel.canView === false) continue;
            var needle = search.toLowerCase();
            if ((session.name && session.name.toLowerCase().indexOf(needle) >= 0) ||
                (session.createdByName && session.createdByName.toLowerCase().indexOf(needle) >= 0) ||
                (session.gameModelName && session.gameModelName.toLowerCase().indexOf(needle) >= 0) ||
                (session.gameModel.comments && session.gameModel.comments.toLowerCase().indexOf(needle) >= 0) ||
                // If searching for a number, the id has to start with the given pattern:
                session.id.toString().indexOf(needle) === 0 ||
                session.gameModelId.toString().indexOf(needle) === 0){
                res.push(session);
            }
        }
        ctrl.archives = res;
        if ( ! $rootScope.$$phase) {
            $scope.$apply();
        }
    };

    // Use jQuery input events, more reliable than Angular's:
    $(document).off("input", '#searchFieldSessionArchives'); // Detach any previous input handler
    $(document).on("input", '#searchFieldSessionArchives', function(){
        // At this point, the search variable is not necessarily updated by Angular to reflect the real input field:
        ctrl.search = this.value;
        ctrl.filterArchives(ctrl.search);
    });

    ctrl.updateSessions = function() {
        ctrl.loading = true;
        SessionsModel.getSessions("BIN").then(function(response) {
            ctrl.loading = false;
            if (response.isErroneous()) {
                response.flash();
            } else {
                ctrl.rawArchives = $filter('orderBy')(response.data, 'createdTime', true) || [];
                // At this point, the search variable is not yet updated by Angular to reflect the input field:
                var searchField = document.getElementById('searchFieldArchives');
                if (searchField) {
                    ctrl.search = searchField.getElementsByClassName('tool__input')[0].value;
                }
                ctrl.filterArchives(ctrl.search);
            }
            if (ctrl.rawArchives.length === 0) {
                $scope.close();
            }
        });
    };

    ctrl.unarchiveSession = function(sessionToUnarchive) {
        if (sessionToUnarchive) {
            SessionsModel.unarchiveSession(sessionToUnarchive).then(function(response) {
                if (!response.isErroneous()) {
                    $rootScope.$emit('changeSessionsArchives', -1);
                    ctrl.updateSessions();
                    // The session is reinserted into the LIVE list, which has to be updated:
                    $rootScope.$emit('changeSessions', true);
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
                    $rootScope.$emit('changeSessionsArchives', -1);
                    ctrl.updateSessions();
                    //$rootScope.$emit('changeSessions', true);
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

    // Find out what the current user's "friendly" username is.
    Auth.getAuthenticatedUser().then(function(user) {
        if (user !== false) {
            UsersModel.getFullUser(user.id).then(function (response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    ctrl.username = response.data.name;
                }
            })
        }
    });

    ctrl.updateSessions();
})
    .directive('trainerSessionsArchivesList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/trainer/archives/directives.tmpl/list.html',
            scope: {
                sessions: "=",
                delete: "=",
                unarchive: "=",
                search: "=",
                details: "=",
                users: "=",
                loading: "=",
                username: "="
            }
        };
    });
