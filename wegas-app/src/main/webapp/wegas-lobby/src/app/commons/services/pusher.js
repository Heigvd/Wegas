angular.module('wegas.service.pusher', [])
    .service('WegasPusher', function($http, $q, $rootScope, Auth, UsersModel) {
        "use strict";
        var service = this,
            ServiceURL = window.ServiceURL,
            pusher,
            channels = [],
            presence = null,
            memberlist = [];

        /*
            for (var j=0; j<200; j++) {
                memberlist.push({id: j, fullname: ('dummy ' + j), email: j+"@root.com", roles: ""});
            }
        */

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

        function initListening(){
            presence.bind('pusher:subscription_succeeded', function(members) {
                members.each(function(member) {
                    addMember(member);
                });
                $rootScope.$emit('update-members');
            });

            presence.bind('pusher:member_added', function(member) {
                addMember(member);
                $rootScope.$emit('update-members');
            });

            presence.bind('pusher:member_removed', function(member) {
                removeMember(member);
                $rootScope.$emit('update-members');
            });
        }

        function addMember(m) { // m = { m.id, m.info }

            function listRoles(roles){
                var res = "",
                    isAdmin = false,
                    isScenarist = false,
                    isTrainer = false;
                // Identify the roles we want to make explicit:
                roles.forEach(function(elem) {
                    switch (elem.name) {
                        case "Trainer":
                            isTrainer = true;
                            break;
                        case "Scenarist":
                            isScenarist = true;
                            break;
                        case "Administrator":
                            isAdmin = true;
                            break;
                    }
                });
                // Order the resulting roles:
                if (isAdmin) res = "Admin ";
                if (isScenarist) res += "Scenarist ";
                if (isTrainer) res += "Trainer ";
                return res;
            }

            var member = { id: m.id, fullname: m.info.name };
            UsersModel.getFullUser(m.id).then(function(response) {
                if (!response.isErroneous()) {
                    member.username = response.data.account.username || "no username ???";
                    member.email = response.data.account.email || "no email ???";
                    member.roles = listRoles(response.data.roles);
                } else {
                    console.log("WegasPusher: could not get details for user " + m.id + " " + m.fullname);
                }
            });
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
