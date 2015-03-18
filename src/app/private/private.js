angular.module('private', [
    'wegas.models.sessions',
    'wegas.models.scenarios',
    'private.player',
    'private.trainer',
    'private.scenarist',
    'private.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private', {
            url: '',
            abstract:true,
            views: {
                'main@': {
                    controller: 'PrivateCtrl as privateCtrl',
                    templateUrl: 'app/private/private.tmpl.html'
                }
            }
        })
    ;
})
.controller('PrivateCtrl', function PrivateCtrl($state, Auth) {
    var privateCtrl = this;
    Auth.getAuthenticatedUser().then(function(user){
        if(user == null){
            $state.go("wegas.public");
        }
        privateCtrl.user = user;
    }); 
});