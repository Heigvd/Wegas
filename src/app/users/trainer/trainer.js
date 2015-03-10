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
    .controller('UsersTrainerCtrl', function() {
        var usersTrainerCtrl = this;
        usersTrainerCtrl.message = "Trainer zone";
    });