angular.module('public.signup', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.public.signup', {
            url: '/signup',
            views: {
                "form": {
                 	controller: 'PublicSignupCtrl as publicSignupCtrl',
            		templateUrl: 'app/public/signup/signup.tmpl.html'
                }
            }

        })
    ;
})
.controller('PublicSignupCtrl', function PublicSignupCtrl($scope, $state, Auth, Flash) {
    var ctrl = this;

    $scope.signup = function () {
        if (this.p1 && this.p1.length > 3) {
            if (this.p1 === this.p2) {
                Auth.signup(this.email, this.username, this.p1).then(function(response) {
                    response.flash();
                });
            } else {
                Flash('danger', 'Passwords are different');
            }
        } else {
            Flash('danger', 'Your password should contains at least 3 characters');
        }
    }
});