'use strict';
angular.module('users.signup', [

])
    .config(function ($stateProvider) {
        $stateProvider
            .state('wegas.users.signup', {
                url: 'signup',
                templateUrl: 'app/users/users-signup/users-signup.tmpl.html',
                controller: 'UsersSignupCtrl as usersSignupCtrl'
            })
        ;
    })
    .controller('UsersSignupCtrl', function() {
        var usersSignupCtrl = this;
        usersSignupCtrl.message = "Signup zone";
    })
;