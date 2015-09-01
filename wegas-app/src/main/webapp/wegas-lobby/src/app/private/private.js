angular.module('private', [
    'wegas.models.permissions',
    'wegas.models.groups',
    'wegas.models.users',
    'wegas.models.sessions',
    'wegas.models.scenarios',
    'wegas.models.teams',
    'wegas.service.pusher',
    'private.player',
    'private.profile',
    'private.trainer',
    'private.scenarist',
    'private.admin',
    'private.logout',
    'private.directives',
    'pusher-angular'
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
.controller('PrivateCtrl', function PrivateCtrl($state, Auth, $translate, $scope, WegasPusher) {
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
        WegasPusher.start();
        privateCtrl.user = user;
        var config = localStorage.getObject("wegas-config");
        if(config.users[user.email]){
            if(config.commons.language !== config.users[user.email].language){
                config.commons.language = config.users[user.email].language;
                localStorage.setObject("wegas-config", config);
            }
            $translate.use(config.users[user.email].language);
        }else{
            config.users[user.email] = {
                language : config.commons.language           
            };
            localStorage.setObject("wegas-config", config);
            $translate.use(config.users[user.email].language);
        }
    });
});