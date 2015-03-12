'use strict';
angular.module('users.logout', [
    'wegas.models.users'
])
    .config(function ($stateProvider) {
        $stateProvider
            .state('wegas.users.logout', {
                url: 'logout',
                controller: 'UsersLogoutCtrl as usersLogoutCtrl'
            })
        ;
    })
    .controller('UsersLogoutCtrl', function($state, $stateParams, UsersModel) {
        UsersModel.logout().then(function(isOut){
            $state.go('wegas.users');
        });
    })
;