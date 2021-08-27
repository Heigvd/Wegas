angular.module('private.admin.groups.edit', [
    'private.admin.groups.edit.directives'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.admin.groups.edit', {
                url: '/:id',
                views: {
                    'modal@wegas.private': {
                        controller: 'AdminGroupsEditController',
                    }
                }
            })
            .state('wegas.private.admin.groups.members', {
                url: "/members/:id",
                views: {
                    "modal@wegas.private": {
                        controller: "AdminGroupsMemberController"
                    }
                }
            });
    })
    .controller("AdminGroupsEditController", function AdminGroupsEditController($animate, $state, ModalService, Auth) {
        "use strict";
        Auth.getAuthenticatedUser().then(function(user) {
            if (user) {
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
    })
    .controller("AdminGroupsMemberController", function($animate, $state, ModalService, Auth) {
        "use strict";
        Auth.getAuthenticatedUser().then(function(user) {
            if (user) {
                if (user.isAdmin) {
                    ModalService.showModal({
                        templateUrl: 'app/private/admin/groups/edit/members.tmpl.html',
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
