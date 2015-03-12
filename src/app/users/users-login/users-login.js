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
        usersLoginCtrl.userToLogin = {};
        var login = function(){
            console.log("Login me please!");
            UsersModel.login(usersLoginCtrl.userToLogin.username, usersLoginCtrl.userToLogin.password).then(function(isConnected){
                if(isConnected){
                    usersLoginCtrl.userToLogin = {};
                    $state.go('wegas.users.trainer');
                }
            });
        }
        usersLoginCtrl.login = login;
    })
;