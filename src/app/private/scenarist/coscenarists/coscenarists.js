angular
    .module('private.scenarist.coscenarists', [
        'private.scenarist.coscenarists.directives'
    ])
    .config(function($stateProvider) {
        $stateProvider
            .state('wegas.private.scenarist.coscenarists', {
                url: '/:scenarioId/coscenarists',
                views: {
                    'modal@wegas.private': {
                        controller: 'CoscenaristsCtrl'
                    }
                }
            });
    })
    .controller('CoscenaristsCtrl', function CoscenaristsCtrl($animate, $state, ModalService) {
        ModalService.showModal({
            templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists.html',
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
    });