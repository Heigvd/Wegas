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
        function LogoutController($state, Auth, SessionsModel, ScenariosModel, TeamsModel, UsersModel, GroupsModel) {
            "use strict";
            Auth.logout().then(function(response) {
                $("body").removeClass("player scenarist trainer admin");
                SessionsModel.clearCache();
                ScenariosModel.clearCache();
                TeamsModel.clearCache();
                UsersModel.clearCache();
                GroupsModel.clearCache();
                $state.go("wegas.public.login");
            });
        });
