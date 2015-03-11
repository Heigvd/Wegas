'use strict';
angular.module('users.player', [
])
    .config(function ($stateProvider) {
        $stateProvider
            .state('wegas.users.player', {
                url: 'player',
                views: {
                    'main@': {
                        templateUrl: 'app/users/player/player.tmpl.html',
                        controller: 'UsersPlayerCtrl as usersPlayerCtrl'
                    }
                }
            })
        ;
    })
    .controller('UsersPlayerCtrl', function($state, $stateParams, UsersModel) {
        var usersPlayerCtrl = this;
            usersPlayerCtrl.message = "Player zone";
        UsersModel.getAuthenticatedUser().then(function(AuthUser){
            if(AuthUser != null){
                // Do something
            }else{
                $state.go("wegas.users.login");
            }
        });
    });