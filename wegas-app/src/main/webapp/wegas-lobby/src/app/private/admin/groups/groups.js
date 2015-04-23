angular.module('private.admin.groups', [
    'private.admin.groups.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.admin.groups', {
            url: '/groups',
            views: {
                'admin-container': {
                    controller: 'AdminGroupsCtrl as adminGroupsCtrl',
                    templateUrl: 'app/private/admin/groups/groups.tmpl.html'
                }
            }
        })
    ;
})
.controller('AdminGroupsCtrl', function AdminGroupsCtrl($state, Auth, ViewInfos) {

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