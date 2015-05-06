angular.module('private.trainer.settings', [
    'private.trainer.settings.directives'
])
    .config(function($stateProvider) {
        $stateProvider
            .state('wegas.private.trainer.settings', {
                url: '/:id/settings',
                views: {
                    'modal@wegas.private': {
                        controller: 'TrainerSettingsController'
                    }
                }
            });
    }).controller("TrainerSettingsController", function TrainerSettingsController($animate, $state, ModalService, Auth) {
        Auth.getAuthenticatedUser().then(function(user) {
            if (user != null) {
                if (user.isAdmin || user.isScenarist || user.isTrainer) {
                    ModalService.showModal({
                        templateUrl: 'app/private/trainer/settings/settings.tmpl.html',
                        controller: "ModalsController as modalsCtrl"
                    }).then(function(modal) {
                        var box = $(".modal"),
                            shadow = $(".shadow");
                        $animate.addClass(box, "modal--open");
                        $animate.addClass(shadow, "shadow--show");

                        modal.close.then(function(result) {
                            $state.go("^");
                        });
                    });
                }
            }
        });
    });