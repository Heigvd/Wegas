angular
.module('private.profile', [
    'ngSanitize',
    'private.profile.directives',
    'wegas.behaviours.modals'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.profile', {
            url: 'user-profile',
            views: {
                'modal@wegas.private': {
                    controller: 'ProfileCtrl'
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
            $state.go($state.previous.name);
        });
    });
});