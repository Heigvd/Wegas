'use strict';
angular.module('users.password', [

])
    .config(function ($stateProvider) {
        $stateProvider
            .state('wegas.users.password', {
                url: 'password',
                templateUrl: 'app/users/users-password/users-password.tmpl.html',
                controller: 'UsersPasswordCtrl as usersPasswordCtrl'
            })
        ;
    })
    .controller('UsersPasswordCtrl', function() {
        var usersPasswordCtrl = this;
        usersPasswordCtrl.message = "Password zone";
    })
;