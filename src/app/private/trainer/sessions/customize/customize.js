angular.module('private.trainer.sessions.customize', [
    'private.trainer.sessions.customize.directives'
])
    .config(function($stateProvider) {
        $stateProvider
            .state('wegas.private.trainer.sessions.customize', {
                url: '/:id/customize',
                views: {
                    'modal@wegas.private': {
                        controller: 'TrainerSessionsCustomizeController'
                    }
                }
            });
    }).controller("TrainerSessionsCustomizeController", function TrainerSessionsCustomizeController($animate, $state, ModalService) {
        ModalService.showModal({
            templateUrl: 'app/private/trainer/sessions/customize/customize.tmpl.html',
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
    });