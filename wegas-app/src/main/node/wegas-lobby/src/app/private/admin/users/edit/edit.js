angular.module('private.admin.users.edit', [
    'private.admin.users.edit.directives'
    ])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.admin.users.edit', {
                url: '/:id',
                views: {
                    'modal@wegas.private': {
                        controller: 'AdminUserEditController',
                    }
                }
            });
    })
    .controller("AdminUserEditController", function AdminUserEditController($animate, $state, ModalService, Auth) {
        "use strict";
        Auth.getAuthenticatedUser().then(function(user) {
            if (user) {
                if (user.isAdmin) {
                    ModalService.showModal({
                        templateUrl: 'app/private/admin/users/edit/edit.tmpl.html',
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
                }
            }
        });
    });