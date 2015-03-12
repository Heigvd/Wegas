angular.module('public.signup', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.public.signup', {
            url: '/signup',
            views: {
                "form@": {
                 	controller: 'PublicSignupCtrl as publicSignupCtrl',
            		templateUrl: 'app/public/public-signup/public-signup.tmpl.html'
                }
            }
           
        })
    ;
})
.controller('PublicSignupCtrl', function PublicSignupCtrl() {
    var publicSignupCtrl = this;
    console.log("Chargement public signup");    
});