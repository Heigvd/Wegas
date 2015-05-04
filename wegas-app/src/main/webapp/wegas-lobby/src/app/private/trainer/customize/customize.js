angular.module('private.trainer.customize', [
    'private.trainer.customize.directives'
])
    .config(function($stateProvider) {
        $stateProvider
            .state('wegas.private.trainer.customize', {
                url: '/:id/customize',
                views: {
                    'modal@wegas.private': {
                        controller: 'TrainerCustomizeController'
                    }
                }
            });
    }).controller("TrainerCustomizeController", function TrainerCustomizeController($animate, $state, ModalService, Auth) {
        Auth.getAuthenticatedUser().then(function(user) {
            if (user != null) {
                if (user.isAdmin || user.isTrainer) {
                    ModalService.showModal({
                        templateUrl: 'app/private/trainer/customize/customize.tmpl.html',
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