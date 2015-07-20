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
.controller('PublicIndexCtrl', function PublicIndexCtrl($scope, $rootScope, $state, $translate, WegasTranslations, Auth) {
    var ctrl = this,
        config = localStorage.getObject("wegas-config");

    ctrl.currentLanguage = config.commons.language;
    ctrl.languages = WegasTranslations.languages;
    ctrl.changeLanguage = function(key){
        config.commons.language = key;
        ctrl.currentLanguage = key;
        $translate.use(key);
        localStorage.setObject("wegas-config", config);
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