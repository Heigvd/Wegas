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
            memberlist = [];

        // Exported roles:
        service.ADMIN_ID = 0;
        service.SCENARIST_TRAINER_ID = 1;
        service.PLAYER_ID = 2;
        service.GUEST_ID = 3;
        service.NONE_ID = 4;

        var roles = [
            { id: service.ADMIN_ID, name: "Admin" },
            { id: service.SCENARIST_TRAINER_ID, name: "Scenarist/Trainer" },
            { id: service.PLAYER_ID, name: "Player" },
            { id: service.GUEST_ID, name: "Guest" },
            { id: service.NONE_ID, name: "No role ???" }
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
                    presence = channels["presence-global"] = pusher.subscribe('presence-global');
                    Auth.getAuthenticatedUser().then(function(user) {
                        if (user && user.isAdmin) {
                            initListening();
                        }
                    });
                }
                deferred.resolve();
            });
            return deferred.promise;
        };

        // Public method for getting the current list of members:
        service.getMembers = function() {
            return memberlist;
        }

        // Public method for getting the list of roles:
        service.getRoles = function() {
            return roles;
        }

        function initListening(){

            presence.bind('pusher:subscription_succeeded', function(members) {
                clearMemberlist();

                // Debugging:
                if (false) {
                    for (var j = 0; j < 200; j++) {
                        memberlist.push({
                            id: j,
                            fullname: ('dummy ' + j),
                            email: j + "@root.com",
                            roles: "",
                            highestRole: service.PLAYER_ID,
                            connectionDate: Date.now()
                        });
                    }
                }

                members.each(function(member) {
                    addMember(member);
                });
                $rootScope.$emit('wegaspusher:update-members');
            });

            presence.bind('pusher:pusher:subscription_error', function(members) {
                clearMemberlist();
                $rootScope.$emit('wegaspusher:service-error', "Connection error - please try again later ...");
            });

            presence.bind('pusher:member_added', function(member) {
                addMember(member);
                $rootScope.$emit('wegaspusher:update-members');
            });

            presence.bind('pusher:member_removed', function(member) {
                removeMember(member);
                $rootScope.$emit('wegaspusher:update-members');
            });
        }

        function clearMemberlist(){
            memberlist = [];
        }

        function addMember(m) { // m = { m.id, m.info }
            function getHighestRole(roles){
                var isAdmin = false,
                    isScenarist = false,
                    isTrainer = false,
                    isPlayer = false,
                    isGuest = false;

                // Identify the roles we want to make explicit:
                roles.forEach(function(elem) {
                    switch (elem.name) {
                        case "Administrator":
                            isAdmin = true;
                            break;
                        case "Scenarist":
                            isScenarist = true;
                            break;
                        case "Trainer":
                        case "PMG-trainer":
                            isTrainer = true;
                            break;
                        case "Public":
                            isPlayer = true;
                            break;
                        case "Guest":
                            isGuest = true;
                            break;
                    }
                });
                // Return only the most privileged role:
                if (isAdmin) return service.ADMIN_ID;
                if (isScenarist || isTrainer) return service.SCENARIST_TRAINER_ID;
                if (isPlayer) return service.PLAYER_ID;
                if (isGuest) return service.GUEST_ID;
                else return service.NONE_ID;
            }

            var member = { id: m.id, fullname: m.info.name };
            UsersModel.getFullUser(m.id).then(function(response) {
                if (!response.isErroneous()) {
                    member.user = response.data;
                    member.username = response.data.account.username || "no username";
                    member.email = response.data.account.email || "no email";
                    member.roles = response.data.roles;
                    member.highestRole = getHighestRole(response.data.roles);
                } else {
                    console.log("WegasPusher: could not get details for user " + m.id + " " + m.fullname);
                }
            });
            member.connectionDate = Date.now();
            memberlist.push(member);
        }

        function removeMember(m) {
            var id = m.id,
                len = memberlist.length,
                i;
            for (i=0; i<len; i++){
                if (memberlist[i].id == id){
                    memberlist.splice(i, 1);
                    return;
                }
            }
            console.log("WegasPusher: could not remove unknown member " + id + " " + m.fullname);
        }
    });
