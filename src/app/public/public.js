angular.module('public', [
    'public.login',
    'public.signup',
    'public.password'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.public', {
            url: 'public',
            views: {
                'main@': {
                    controller: 'PublicIndexCtrl as publicIndexCtrl',
                    templateUrl: 'app/public/public.tmpl.html'
                },
                "form@wegas.public": {
                    controller: 'PublicLoginCtrl as publicLoginCtrl',
                    templateUrl: 'app/public/public-login/public-login.tmpl.html'
                }
            }
        })
    ;
})
.controller('PublicIndexCtrl', function PublicIndexCtrl($state) {
    var publicIndexCtrl = this;
    console.log("Chargement public index");    
});