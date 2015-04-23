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
.controller('PublicSignupCtrl', function PublicSignupCtrl($state, Auth) {
    var publicSignupCtrl = this;
        publicSignupCtrl.formInfo = {};

    var signup = function () {

        console.log("-> Registering user");

        /* TODO: Implement correct form validation */
        if (publicSignupCtrl.formInfo.p1 == publicSignupCtrl.formInfo.p2) {
            Auth.signup(publicSignupCtrl.formInfo.email, publicSignupCtrl.formInfo.p1).then(function(result) {
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
    publicSignupCtrl.signup = signup;
});