angular.module('private.admin.who', [
    'wegas.service.pusher',
    'private.admin.users.edit'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.admin.who', {
                url: '/who',
                views: {
                    'admin-container': {
                        controller: 'AdminWhoCtrl as adminWhoCtrl',
                        templateUrl: 'app/private/admin/who/who.tmpl.html'
                    }
                }
            });
    })

    .controller('AdminWhoCtrl', function AdminWhoCtrl($state, $scope, $http, $rootScope, Auth, WegasPusher, $timeout) {
        "use strict";
        var ctrl = this;
        ctrl.who = [];
        ctrl.loading = true;
        ctrl.syncing = false;
        // This message is displayed as soon as it contains a non-empty string:
        ctrl.message = "";

        // Each array entry has properties { id: integer, name: string }
        ctrl.roles = WegasPusher.getRoles();

        ctrl.requestClientReload = function() {
            WegasPusher.requestClientReload();
        };

        ctrl.sync = function() {
            ctrl.syncing = true;
            var req = WegasPusher.syncMembers();
            req.success(function() {
                ctrl.updateWhoList();
                $timeout(function() {
                    ctrl.syncing = false;
                }, 250); // The spinner should be visible at least 1/4 sec.
            });
        };

        ctrl.updateWhoList = function() {
            var req = WegasPusher.getMembers();
            req.success(function(onlineUsers) {
                ctrl.who = onlineUsers;

                ctrl.loading = false;
                if (!$rootScope.$$phase) {
                    $scope.$apply();
                }
            });

        };
        ctrl.beByAccountId = function(accountId, name) {
            if (!window.confirm("Reload to pretend to be \"" + name + "\"?")) {
                return;
            }
            $http.post("rest/User/Be/" + accountId).success(function(result) {
                window.location.reload();
            });
        };
        ctrl.getConnectionDate = function(user) {
            var d = new Date(user.connectionDate);
            return d.toLocaleString();
        };

        ctrl.getLastActivityDate = function(user) {
            var d = new Date(user.lastActivityDate);
            return d.toLocaleString();
        };

        ctrl.handlers = {
            detachUpdateMembers: $rootScope.$on('wegaspusher:update-members', function(e) {
                ctrl.message = "";
                ctrl.updateWhoList();
            }),

            detachServiceError: $rootScope.$on('wegaspusher:service-error', function(e, msg) {
                ctrl.message = msg;
                ctrl.updateWhoList();
            })
        };

        $scope.$on("$destroy", function() {
            for (var key in ctrl.handlers) {
                ctrl.handlers[key]();
            }
        });

        // Required e.g. when closing the profile edition window:
        ctrl.updateWhoList();

    });
