angular
.module('private.scenarist.scenarios.archives', [
    'private.scenarist.scenarios.archives.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.scenarios.archives', {
            url: '/archives',
            views: {
                'modal@wegas.private': {
                    controller: 'ScenaristScenariosArchivesController as archivesCtrl'
                }
            }
        });
})
.controller('ScenaristScenariosArchivesController', function ScenaristScenariosArchivesController($animate, $state, ModalService) {
    ModalService.showModal({
        templateUrl: 'app/private/scenarist/scenarios/archives/archives.tmpl.html',
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