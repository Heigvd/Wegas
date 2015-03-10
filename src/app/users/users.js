'use strict';
angular.module('users', [
    'users.login',
    'users.signup',
    'users.password',
    'users.player',
    'users.trainer',
    // 'users.scenarist',
    'wegas.models.users'
])
    .config(function ($stateProvider) {
        $stateProvider
            .state('wegas.users', {
                url: '/',
                views: {
                    'main@': {
                        templateUrl: 'app/users/users.tmpl.html',
                        controller: 'UsersCtrl as usersCtrl'
                    }
                }
            })
        ;
    })
    .controller('UsersCtrl', function($state, $stateParams, UsersModel) {
        var usersCtrl = this;
        UsersModel.isLogged().then(function(data){
            console.log(data);
            if(data){
                console.log("Hello");
                UsersModel.getAuthenticateUser().then(function(data){
                    console.log(data);
                    if(data.isTrainer){
                        $state.go('wegas.users.trainer');
                    }else{
                        $state.go('wegas.users.player');
                    }
                });
            }else{
                console.log("Pas hello");
                usersCtrl.message = "Public zone";
                $state.go('wegas.users.login');
            }
        });
    });
;
