angular.module('public', [
    'public.login',
    'public.signup',
    'public.password'
])
.config(function ($stateProvider, $translateProvider) {
    $stateProvider
        .state('wegas.public', {
            url: 'public',
            views: {
                'main@': {
                    controller: 'PublicIndexCtrl',
                    templateUrl: 'app/public/public.tmpl.html'
                },
                "form@wegas.public": {
                    controller: 'PublicLoginCtrl as publicLoginCtrl',
                    templateUrl: 'app/public/login/login.tmpl.html'
                }
            }
        })
    ;
    
    $translateProvider.translations('en', {
        'PASSWORD-BTN': "Password forgotten",
        'CREATE-ACCOUNT-LABEL': "Haven't yet a Wegas account ?",
        'CREATE-ACCOUNT-BTN': "Create account",
        'LOGIN-BTN': "Login"
    });
    
    $translateProvider.translations('fr', {
        'PASSWORD-BTN': "Mot de passe oublié",
        'CREATE-ACCOUNT-LABEL': "Pas encore de compte Wegas ?",
        'CREATE-ACCOUNT-BTN': "Créer un compte",
        'LOGIN-BTN': "Connexion"
    });
 
    if(localStorage.getObject("wegas-config@public")){
        $translateProvider.preferredLanguage(localStorage.getObject("wegas-config@public").language);
    }else{
        localStorage.setObject("wegas-config@public", {
            'language':'fr'
        });
        $translateProvider.preferredLanguage('fr');
    }
    console.log(localStorage.getObject('wegas-config@public'));
})
.controller('PublicIndexCtrl', function PublicIndexCtrl($scope, $rootScope, $state, Auth) {

    updateAlternativeActionsButton = function (state) {
        $scope.destination = $state.href('wegas.public.signup');
        $scope.destinationTitle = "Registration";
        if (state.name == "wegas.public.signup") {
            $scope.destination = $state.href('wegas.public.login');
            $scope.destinationTitle = "Authentication";
        }
    };
    updateAlternativeActionsButton($state.current);
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        updateAlternativeActionsButton(toState);
    });
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