/*
 ** This service subscribes to the default presence channel to stay informed about connected users.
 ** Client modules are in turn informed via events "wegaspusher:update-members" and "wegaspusher:service-error".
 */

angular.module('wegas.service.pusher', [])

    .service('WegasPusher', function($http, $q, $rootScope, Auth, UsersModel) {
        "use strict";
        var service = this,
            ServiceURL = window.ServiceURL,
            pusher,
            channels = [],
            presence = null,
            userChannel = null,
            adminChannel = null;

        // Exported roles:
        service.ADMIN_ID = 0;
        service.SCENARIST_TRAINER_ID = 1;
        service.PLAYER_ID = 2;
        service.GUEST_ID = 3;
        service.NONE_ID = 4;

        var roles = [
            {id: service.ADMIN_ID, name: "Admin"},
            {id: service.SCENARIST_TRAINER_ID, name: "Scenarist/Trainer"},
            {id: service.PLAYER_ID, name: "Player"},
            {id: service.GUEST_ID, name: "Guest"},
            {id: service.NONE_ID, name: "No role ???"}
        ];

        /*global Pusher*/
        service.start = function() {
            var deferred = $q.defer();
            $http.get(ServiceURL + "rest/Pusher/ApplicationKey").success(function(authInfo) {
                if (authInfo && authInfo.key) {
                    pusher = new Pusher(authInfo.key, {
                        authEndpoint: ServiceURL + "rest/Pusher/auth",
                        cluster: authInfo.cluster
                    });
                    presence = channels["global"] = pusher.subscribe('global-channel');
                    Auth.getAuthenticatedUser().then(function(user) {
                        if (user) {
                            userChannel = channels["user"] = pusher.subscribe('private-User-' + user.id);
                            if (user.isAdmin) {
                                adminChannel = channels["admin"] = pusher.subscribe('private-Role-Administrator');
                            }
                            initListening();
                        }
                    });
                }
                deferred.resolve();
            });
            return deferred.promise;
        };

        service.disconnect = function() {
            if (pusher) {
                pusher.disconnect();
            }
        };

        // Public method for getting the current list of members:
        service.getMembers = function() {
            return $http.get(ServiceURL + "rest/Pusher/OnlineUser");
        };

        // Public method to sync the current list of members on the server
        service.syncMembers = function() {
            return $http.get(ServiceURL + "rest/Pusher/OnlineUser/Sync");
        };



        // Public method for getting the list of roles:
        service.getRoles = function() {
            return roles;
        };

        service.requestClientReload = function() {
            return $http.post(ServiceURL + "rest/Pusher/RequestClientReload");
        };

        function initListening() {
            if (adminChannel) {
                adminChannel.bind('online-users', function(data) {
                    $rootScope.$emit('wegaspusher:update-members');
                });
            }
            if (userChannel) {
                userChannel.bind('team-update', function(team) {
                    $rootScope.$emit('wegaspusher:team-update', team);
                });
            }
            if (presence) {
                presence.bind('populateQueue-dec', function(size) {
                    $rootScope.$emit('wegaspusher:populateQueue-dec', size);
                });
            }
        }
    });
