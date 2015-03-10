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
    .controller('UsersPlayerCtrl', function(UsersModel) {
        var usersPlayerCtrl = this;
        usersPlayerCtrl.authenticateUser = UsersModel.getAuthenticateUser();
        usersPlayerCtrl.message = "Player zone";
    });