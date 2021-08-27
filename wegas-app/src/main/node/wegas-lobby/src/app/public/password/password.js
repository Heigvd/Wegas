angular.module('public.password', [
    'public.password.directives'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.public.password', {
                url: '/password',
                views: {
                    "modal@wegas.public": {
                        controller: 'PublicPasswordModalController'
                    }
                }

            });
    })
    .controller("PublicPasswordModalController", function PublicPasswordModalController($state, WegasModalService) {
        "use strict";
        WegasModalService.displayAModal({
            templateUrl: 'app/public/password/password.tmpl.html',
            controller: "ModalsController as modalsCtrl"
        }).then(function(modal) {
            modal.close.then(function(result) {
                $state.go("^");
            });
        });
    });