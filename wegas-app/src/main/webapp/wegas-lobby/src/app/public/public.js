angular.module('public', [
    'wegas.directives.language.tool',
    'public.login',
    'public.signup',
    'public.password'
])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
        .state('wegas.public', {
            url: 'public',
            views: {
                'main@': {
                    controller: 'PublicIndexCtrl as publicCtrl',
                    templateUrl: 'app/public/public.tmpl.html'
                },
                "form@wegas.public": {
                    controller: 'PublicLoginCtrl as publicLoginCtrl',
                    templateUrl: 'app/public/login/login.tmpl.html'
                }
            }
        })
    ;
})
.controller('PublicIndexCtrl', function PublicIndexCtrl($state, Auth) {
    "use strict";
    Auth.getAuthenticatedUser().then(function(user){
        if(user !== null){
            if(user.isScenarist){
                $state.go("wegas.private.scenarist");
            }else{
                if(user.isTrainer){
                    $state.go("wegas.private.trainer");
                }else{
                    $state.go("wegas.private.player");
                }
            }
        }
    });
});
