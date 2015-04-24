angular
    .module('private.profile', [
        'ngSanitize',
        'private.profile.directives',
        'private.scenarist',
        'private.trainer',
        'private.player',
        'wegas.behaviours.modals'
    ])
    .config(function($stateProvider) {
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
                        templateUrl: 'app/private/trainer/sessions/sessions.tmpl.html'
                    }
                }
            })
            .state('wegas.private.profile.player', {
                views: {
                    'workspace@wegas.private': {
                        controller: 'PlayerCtrl as playerCtrl',
                        templateUrl: 'app/private/player/sessions/sessions.tmpl.html'
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
            .state('wegas.private.profile.admin', {
                views: {
                    'workspace@wegas.private': {
                        controller: 'AdminCtrl as adminCtrl',
                        templateUrl: 'app/private/admin/directives.tmpl/index.html',
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
            });

    })
    .controller('ProfileCtrl', function ProfileCtrl($animate, $state, ModalService) {

        ModalService.showModal({
            templateUrl: 'app/private/profile/tmpl/profile.html',
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
                var destination = ($state.previous.name == "") ? "wegas.public" : $state.previous.name;
                $state.go(destination);
            });
        });
    });