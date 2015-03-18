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
.controller('PublicLoginCtrl', function PublicLoginCtrl($state, Auth) {
    var publicLoginCtrl = this;
        publicLoginCtrl.message = "Login zone";
        publicLoginCtrl.userToLogin = {};
    var login = function(){
        Auth.login(publicLoginCtrl.userToLogin.username, publicLoginCtrl.userToLogin.password).then(function(isConnected){
            if(isConnected){
                publicLoginCtrl.userToLogin = {};
                $state.go('wegas');
            }
        });
    }
    publicLoginCtrl.login = login;  
});