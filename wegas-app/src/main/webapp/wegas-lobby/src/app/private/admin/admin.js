angular.module('private.admin', [
    'private.admin.directives',
    'private.admin.users',
    'private.admin.groups'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.admin', {
            url: 'admin',
            views: {
                'workspace': {
                    controller: 'AdminCtrl as adminCtrl',
                    templateUrl: 'app/private/admin/directives.tmpl/index.html'
                }
            }
        })
    ;
})
.controller('AdminCtrl', function AdminCtrl($state, Auth, ViewInfos) {
    var trainerCtrl = this;
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