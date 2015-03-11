'use strict';
angular.module('users.signup', [
    'wegas.models.users'
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
.controller('UsersSignupCtrl', function ($scope, $state, $stateParams, UsersModel){
    $scope.formInfo = {};

    var usersSignupCtrl = this;

    var signup = function () {

        console.log("-> Registering user");

        /* TODO: Implement correct form validation */
        if ($scope.formInfo.p1 == $scope.formInfo.p2) {
            UsersModel.signup($scope.formInfo.email, $scope.formInfo.p1).then(function(result) {
                if(result === true) {
                    /* TODO: Implement sweet and nice information/modal message */
                    window.alert('Thanks. You can now connect!')
                } else {
                    /* TODO: Implement sweet and nice information/modal message */
                    window.alert('Oups... ' + result.message);
                }
            });
        } else {
            /* TODO: Implement sweet and nice information/modal message */
            window.alert('Password are different');
        }
    }
    usersSignupCtrl.signup = signup;
})
;