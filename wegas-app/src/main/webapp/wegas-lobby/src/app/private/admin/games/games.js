angular.module('private.admin.games', [
    'private.admin.games.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.admin.games', {
            url: '/games',
            views: {
                'admin-container': {
                    controller: 'AdminGamesCtrl as adminGamesCtrl',
                    templateUrl: 'app/private/admin/games/games.tmpl.html'
                }
            }
        })
    ;
})
.controller('AdminGamesCtrl', function AdminGamesCtrl($state, Auth, ViewInfos) {

    Auth.getAuthenticatedUser().then(function(user){
        if(user != null){
            if(!user.isAdmin){
                $state.go("wegas.private.scenarist");
            }
            ViewInfos.editName("Admin workspace");
        }
    });
})
;