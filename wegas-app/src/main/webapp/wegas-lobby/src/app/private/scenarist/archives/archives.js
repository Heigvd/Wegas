angular
.module('private.scenarist.archives', [
    'private.scenarist.archives.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.archives', {
            url: '/archives',
            views: {
                'modal@wegas.private': {
                    controller: 'ScenaristArchivesController as archivesCtrl'
                }
            }
        });
})
.controller('ScenaristArchivesController', function ScenaristArchivesController($animate, $state, ModalService, Auth) {
    Auth.getAuthenticatedUser().then(function(user) {
        if (user != null) {
            if (user.isAdmin || user.isScenarist) {
                ModalService.showModal({
                    templateUrl: 'app/private/scenarist/archives/archives.tmpl.html',
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