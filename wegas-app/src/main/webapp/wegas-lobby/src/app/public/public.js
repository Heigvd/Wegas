angular.module('public', [
    'public.login',
    'public.signup',
    'public.password'
])
.config(function ($stateProvider) {
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
.controller('PublicIndexCtrl', function PublicIndexCtrl($scope, $rootScope, $state, $translate, Auth) {
    var ctrl = this;
    ctrl.currentLanguage = localStorage.getObject("wegas-config@public").language;
    ctrl.changeLanguage = function(key){
        var config = localStorage.getObject("wegas-config@public");
        config.language = key;
        ctrl.currentLanguage = key;
        $translate.use(key);
        localStorage.setObject("wegas-config@public", config);
    };
    Auth.getAuthenticatedUser().then(function(user){
        if(user != null){
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