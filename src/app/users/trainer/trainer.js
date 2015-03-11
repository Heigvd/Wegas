'use strict';
angular.module('users.trainer', [
])
    .config(function ($stateProvider) {
        $stateProvider
            .state('wegas.users.trainer', {
                url: 'trainer',
                views: {
                    'main@': {
                        templateUrl: 'app/users/trainer/trainer.tmpl.html',
                        controller: 'UsersTrainerCtrl as usersTrainerCtrl'
                    }
                }
            })
        ;
    })
    .controller('UsersTrainerCtrl', function($state, UsersModel) {
        var usersTrainerCtrl = this;
        usersTrainerCtrl.message = "Trainer zone";
        UsersModel.getAuthenticatedUser().then(function(AuthUser){
            if(AuthUser != null){
                // Do something
            }else{
                $state.go("wegas.users.login");
            }
        });
    });