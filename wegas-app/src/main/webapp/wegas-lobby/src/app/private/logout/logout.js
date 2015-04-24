angular.module('private.logout', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.logout', {
            url: 'logout',
        	views: {
    		 	'workspace': {
                    controller: 'LogoutController as logoutCtrl',
                }
            }
        })
    ;
})
.controller('LogoutController', function LogoutController($state, Auth, SessionsModel, ScenariosModel, Flash) {
    Auth.logout().then(function(response){
    	SessionsModel.clearCache();
    	ScenariosModel.clearCache();
        $state.go("wegas.public.login");
    });
});