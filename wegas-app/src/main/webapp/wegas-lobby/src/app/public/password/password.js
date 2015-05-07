angular.module('public.password', [
    'public.password.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.public.password', {
            url: '/password',
            views: {
        		"modal@wegas.public" :{
            		controller: 'PublicPasswordModalController'
            	}
            }
            
        })
    ;
})
.controller("PublicPasswordModalController", function PublicPasswordModalController($animate, $state, ModalService) {
        ModalService.showModal({
            templateUrl: 'app/public/password/password.tmpl.html',
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
    })
;