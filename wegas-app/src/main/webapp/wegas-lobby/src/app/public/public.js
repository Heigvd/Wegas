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
})
.controller('PublicIndexCtrl', function PublicIndexCtrl($scope, $rootScope, $state, Auth) {

    updateAlternativeActionsButton = function (state) {
        $scope.destination = $state.href('wegas.public.signup');
        $scope.destinationTitle = "Registration";
        if (state.name == "wegas.public.signup") {
            $scope.destination = $state.href('wegas.public.login');
            $scope.destinationTitle = "Authentication";
        }
    }
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