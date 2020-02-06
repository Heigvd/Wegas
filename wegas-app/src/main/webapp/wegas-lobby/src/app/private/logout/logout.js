angular.module('private.logout', [])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.logout', {
                url: 'logout',
                views: {
                    'workspace': {
                        controller: 'LogoutController as logoutCtrl',
                    }
                }
            })
        ;
    })
    .controller('LogoutController',
        function LogoutController($state, Auth, SessionsModel, ScenariosModel, TeamsModel, UsersModel, GroupsModel, WegasPusher) {
            "use strict";
            Auth.logout().then(function(response) {
                $("body").removeClass("player scenarist trainer admin guest");
                SessionsModel.clearCache();
                ScenariosModel.clearCache();
                TeamsModel.clearCache();
                UsersModel.clearCache();
                GroupsModel.clearCache();
                WegasPusher.disconnect();
                // Remove Pusher-specific localStorage items:
                localStorage.removeItem('pusherTransportEncrypted');
                localStorage.removeItem('pusherTransportTLS');
                localStorage.removeItem('pusherTransportUnencrypted'); // Exists only in developer mode
                $state.go("wegas.public.login");
            });
        });
