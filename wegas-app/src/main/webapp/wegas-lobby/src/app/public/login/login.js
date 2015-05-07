angular.module('public.login', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.public.login', {
            url: '/login',
        	views: {
        		"form" :{
            		controller: 'PublicLoginCtrl as publicLoginCtrl',
            		templateUrl: 'app/public/login/login.tmpl.html'
            	}
            }
        })
    ;
})
.controller('PublicLoginCtrl', function PublicLoginCtrl($scope, Flash, Auth, $state) {

    var publicLoginCtrl = this;

    $scope.login = function(){
        console.info('as');
        if (this.username && this.password) {
            Auth.login(this.username, this.password).then(function(response){
                if(response.isErroneous()) {
                    response.flash();
                } else {
                    $scope.username = $scope.password = "";
                    $state.go('wegas');
                }
            });
        } else {
            Flash.danger('username/password cannot be empty');
        }
    };
});