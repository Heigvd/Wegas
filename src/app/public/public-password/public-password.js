angular.module('public.password', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.public.password', {
            url: '/password',
            views: {
        		"form" :{
            		controller: 'PublicPasswordCtrl as publicPasswordCtrl',
            		templateUrl: 'app/public/public-password/public-password.tmpl.html'
            	}
            }
            
        })
    ;
})
.controller('PublicPasswordCtrl', function PublicPasswordCtrl() {
    var publicPasswordCtrl = this;
    console.log("Chargement public password");    
});