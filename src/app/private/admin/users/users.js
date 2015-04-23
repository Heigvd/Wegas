angular.module('private.admin.users', [
    'private.admin.users.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.admin.users', {
            url: '/users',
            views: {
                'admin-container': {
                    controller: 'AdminUsersCtrl as adminUsersCtrl',
                    templateUrl: 'app/private/admin/users/users.tmpl.html'
                }
            }
        })
    ;
})
.controller('AdminUsersCtrl', function AdminUsersCtrl($state, Auth, ViewInfos) {

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