angular.module('private.trainer.archives', [
    'private.trainer.archives.directives'
])
    .config(function($stateProvider) {
        $stateProvider
            .state('wegas.private.trainer.archives', {
                url: '/archives',
                views: {
                    'modal@wegas.private': {
                        controller: 'TrainerArchivesController'
                    }
                }
            });
    }).controller("TrainerArchivesController", function TrainerArchivesController($animate, $state, ModalService) {
        ModalService.showModal({
            templateUrl: 'app/private/trainer/archives/archives.tmpl.html',
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