angular.module('public.signup', [
    'public.signup.directives'
])
.config(function ($stateProvider) {
    "use strict";
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
.controller('PublicSignupModalCtrl', function PublicSignupModalCtrl($animate, $state, WegasModalService) {
    "use strict";
     WegasModalService.displayAModal({
        templateUrl: 'app/public/signup/signup.tmpl.html',
        controller: "ModalsController as modalsCtrl"
    }).then(function(modal) {
        modal.close.then(function(result) {
            $state.go("^");
        });
    });
});