'use strict';
angular.module('users.login', [
    'wegas.models.users'
])
    .config(function ($stateProvider) {
        $stateProvider
            .state('wegas.users.login', {
                url: 'login',
                templateUrl: 'app/users/users-login/users-login.tmpl.html',
                controller: 'UsersLoginCtrl as usersLoginCtrl'
            })
        ;
    })
    .controller('UsersLoginCtrl', function($state, $stateParams, UsersModel) {
        var usersLoginCtrl = this;
        usersLoginCtrl.message = "Login zone";

        var login = function(){
            console.log("Login me please!");
            if(UsersModel.login()){
                var authUser = UsersModel.getAuthenticateUser();
                if(authUser.isTrainer){
                    $state.go('wegas.users.trainer');
                }else{
                    $state.go('wegas.users.player');
                }
            }
        }
        usersLoginCtrl.login = login;
    })
;