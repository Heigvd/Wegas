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
        function LogoutController($rootScope, $state, Auth, SessionsModel, ScenariosModel, TeamsModel, UsersModel, GroupsModel, WegasPusher) {
            "use strict";
            Auth.logout().then(function(response) {
                $("body").removeClass("player scenarist trainer admin guest");
                SessionsModel.clearCache();
                ScenariosModel.clearCache();
                TeamsModel.clearCache();
                UsersModel.clearCache();
                GroupsModel.clearCache();
                WegasPusher.disconnect();
                // To properly handle re-logins, store current language in global
                // variable instead of localStorage, which will be deleted:
                var cfg = localStorage.getObject("wegas-config");
                $rootScope.language = cfg.commons.language;
                // Delete player-level localStorage items, while keeping trainer and scenarist items:
                localStorage.removeItem("wegas-config");
                localStorage.removeItem('pusherTransportEncrypted');
                localStorage.removeItem('pusherTransportTLS');
                localStorage.removeItem('pusherTransportUnencrypted'); // Exists only in developer mode
                $state.go("wegas.public.login");
            });
        });
