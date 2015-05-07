angular
.module('private.scenarist.history', [
    'private.scenarist.history.directives'
    ])
.config(function ($stateProvider) {
    $stateProvider
    .state('wegas.private.scenarist.history', {
        url: '/:scenarioId/history',
        views: {
            'modal@wegas.private': {
                controller: 'ScenaristHistoryController',
            }
        }
    });
})
.controller("ScenaristHistoryController", function ScenaristHistoryController($animate, $state, ModalService, Auth){
    Auth.getAuthenticatedUser().then(function(user) {
        if (user != null) {
            if (user.isAdmin || user.isScenarist) {
                ModalService.showModal({
                    templateUrl: 'app/private/scenarist/history/history.tmpl.html',
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