angular.module('public.login', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.public.login', {
            url: '/login',
        	views: {
        		"form" :{
            		controller: 'PublicLoginCtrl as publicLoginCtrl',
            		templateUrl: 'app/public/public-login/public-login.tmpl.html'
            	}
            }
        })
    ;
})
.controller('PublicLoginCtrl', function PublicLoginCtrl() {
    var publicLoginCtrl = this;
    console.log("Chargement public login");    
});