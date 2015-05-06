angular.module('private', [
    'wegas.models.sessions',
    'wegas.models.scenarios',
    'wegas.models.users',
    'wegas.models.groups',
    'private.player',
    'private.profile',
    'private.trainer',
    'private.scenarist',
    'private.admin',
    'private.logout',
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
.controller('PrivateCtrl', function PrivateCtrl($state, Auth, $scope) {
    var privateCtrl = this;
    privateCtrl.loading = 0;
    $scope.$on('cfpLoadingBar:loading', function () {
        if (privateCtrl.loading == 0) {
            $('.view--top').addClass('view--loading');
        }
        privateCtrl.loading++;
    });
    $scope.$on('cfpLoadingBar:started', function () {

    });
    $scope.$on('cfpLoadingBar:loaded', function () {
        privateCtrl.loading--;
    });
    $scope.$on('cfpLoadingBar:completed', function () {
        if (privateCtrl.loading == 0) {
            $('.view--top').removeClass('view--loading');
        }
    });
    Auth.getAuthenticatedUser().then(function(user){
        if(user == null){
            $state.go("wegas.public");
        }
        privateCtrl.user = user;
    });
});