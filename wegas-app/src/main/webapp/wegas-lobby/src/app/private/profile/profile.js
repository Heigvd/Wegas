angular
    .module('private.profile', [
        'ngSanitize',
        'private.profile.directives',
        'private.modeler',
        'private.scenarist',
        'private.trainer',
        'private.player',
        'wegas.behaviours.modals'
    ])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.profile', {
                url: 'user-profile',
                views: {
                    'modal@wegas.private': {
                        controller: 'ProfileCtrl'
                    }
                }
            })
            .state('wegas.private.profile.trainer', {
                views: {
                    'workspace@wegas.private': {
                        controller: 'TrainerCtrl as trainerCtrl',
                        templateUrl: 'app/private/trainer/trainer.tmpl.html'
                    }
                }
            })
            .state('wegas.private.profile.player', {
                views: {
                    'workspace@wegas.private': {
                        controller: 'PlayerCtrl as playerCtrl',
                        templateUrl: 'app/private/player/player.tmpl.html'
                    }
                }
            })
            .state('wegas.private.profile.scenarist', {
                views: {
                    'workspace@wegas.private': {
                        controller: 'ScenaristCtrl as scenaristCtrl',
                        templateUrl: 'app/private/scenarist/scenarist.tmpl.html'
                    }
                }
            })
            .state('wegas.private.profile.modeler', {
                views: {
                    'workspace@wegas.private': {
                        controller: 'ModelerCtrl as modelerCtrl',
                        templateUrl: 'app/private/modeler/modeler.tmpl.html'
                    }
                }
            })
            .state('wegas.private.profile.admin', {
                views: {
                    'workspace@wegas.private': {
                        controller: 'AdminCtrl as adminCtrl',
                        templateUrl: 'app/private/admin/admin.tmpl.html',
                    }
                }
            })
            .state('wegas.private.profile.admin.who', {
                views: {
                    'admin-container@wegas.private.profile.admin': {
                        controller: 'AdminWhoCtrl as adminWhoCtrl',
                        templateUrl: 'app/private/admin/who/who.tmpl.html'
                    }
                }
            })
            .state('wegas.private.profile.admin.users', {
                views: {
                    'admin-container@wegas.private.profile.admin': {
                        controller: 'AdminUsersCtrl as adminUsersCtrl',
                        templateUrl: 'app/private/admin/users/users.tmpl.html'
                    }
                }
            })
            .state('wegas.private.profile.admin.groups', {
                views: {
                    'admin-container@wegas.private.profile.groups': {
                        controller: 'AdminGroupsCtrl as adminGroupsCtrl',
                        templateUrl: 'app/private/admin/groups/groups.tmpl.html'
                    }
                }
            });

    })
    .controller('ProfileCtrl', function ProfileCtrl($animate, $state, ModalService) {
        "use strict";
        ModalService.showModal({
            templateUrl: 'app/private/profile/profile.tmpl.html',
            controller: "ModalsController as modalsCtrl"
        }).then(function(modal) {
            var box = $(".modal"),
                shadow = $(".shadow");

            $('body').addClass('modal-displayed');
            $animate.addClass(box, "modal--open");
            $animate.addClass(shadow, "shadow--show");

            modal.close.then(function(result) {
                $('body').removeClass('modal-displayed');
                // Ensure a state will be found
                var destination = ($state.previous.name === "") ? "wegas.public" : $state.previous.name;
                $state.go(destination);
            });
        });
    });
