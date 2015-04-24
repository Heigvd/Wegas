angular.module('private.admin.users', [
    'private.admin.users.directives',
    'wegas.behaviours.modals'
])
    .config(function($stateProvider) {
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
            .state('wegas.private.admin.users.edit', {
                url: '/:id',
                views: {
                    'modal@wegas.private': {
                        controller: 'AdminUserEditController',
                    },
                    'workspace@wegas.private.admin': {
                        controller: 'AdminGroupsCtrl as adminGroupsCtrl',
                        templateUrl: 'app/private/admin/groups/groups.tmpl.html'
                    }
                }
            });
    })
    .controller('AdminUsersCtrl', function AdminUsersCtrl($state, Auth, ViewInfos) {

        Auth.getAuthenticatedUser().then(function(user) {
            if (user != null) {
                if (!user.isAdmin) {
                    $state.go("wegas.private.scenarist");
                }
                ViewInfos.editName("Admin workspace");
            }
        });
    })
    .controller("AdminUserEditController", function AdminUserEditController($animate, $state, ModalService) {
        ModalService.showModal({
            templateUrl: 'app/private/admin/users/directives.tmpl/modal.html',
            controller: "ModalsController as modalsCtrl"
        }).then(function(modal) {
            var box = $(".modal"),
                shadow = $(".shadow");

            $('body').addClass('modal-displayed');
            $animate.addClass(box, "modal--open");
            $animate.addClass(shadow, "shadow--show");

            modal.close.then(function(result) {
                $('body').removeClass('modal-displayed');
                $state.go("^");
            });
        });
    });;