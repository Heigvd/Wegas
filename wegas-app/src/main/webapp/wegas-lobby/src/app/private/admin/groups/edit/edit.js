angular.module('private.admin.groups.edit', [
	'private.admin.groups.edit.directives'
    ])
    .config(function($stateProvider) {
        $stateProvider
            .state('wegas.private.admin.groups.edit', {
                url: '/:id',
                views: {
                    'modal@wegas.private': {
                        controller: 'AdminGroupsEditController',
                    }
                }
            });
    })
    .controller("AdminGroupsEditController", function AdminGroupsEditController($animate, $state, ModalService, Auth) {
        Auth.getAuthenticatedUser().then(function(user) {
            if (user != null) {
                if (user.isAdmin) {
                    ModalService.showModal({
                        templateUrl: 'app/private/admin/groups/edit/edit.tmpl.html',
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