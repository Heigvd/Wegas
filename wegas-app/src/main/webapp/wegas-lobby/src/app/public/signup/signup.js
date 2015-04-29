angular.module('public.signup', [
    'public.signup.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.public.signup', {
            url: '/signup',
            views: {
                "modal@wegas.public" :{
                    controller: 'PublicSignupModalCtrl'
                }
            }

        })
    ;
})
.controller('PublicSignupModalCtrl', function PublicSignupModalCtrl($animate, $state, ModalService) {
     ModalService.showModal({
        templateUrl: 'app/public/signup/signup.tmpl.html',
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