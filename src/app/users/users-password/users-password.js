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
    .controller('UsersPasswordCtrl', function ($scope, $state, $stateParams, UsersModel) {
        var usersPasswordCtrl = this;

        $scope.formInfo = {};

        var usersSignupCtrl = this;

        var remindPassword = function () {

            console.log("-> Reminding user password");

            /* TODO: Implement correct form validation */
            if ($scope.formInfo.email != "") {
                UsersModel.remindPassword($scope.formInfo.email).then(function(result) {
                    if(result === true) {
                        /* TODO: Implement sweet and nice information/modal message */
                        window.alert('Thanks. If the account exists, you will receive an email to reset your password!');
                    } else {
                        /* TODO: Implement sweet and nice information/modal message */
                        /* It seems the services return always true */
                        window.alert('Oups... An error has occurred...');
                    }
                });
            } else {
                /* TODO: Implement sweet and nice information/modal message */
                window.alert('Username is empty..');
            }
        }
        usersPasswordCtrl.remindPassword = remindPassword;
    })
;