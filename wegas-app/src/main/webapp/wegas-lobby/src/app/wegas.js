var ServiceURL = "",
    MAX_DISPLAYED_CHARS = 32;
    
Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}
 
Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
}

angular.module('Wegas', [
    'flash',
    'ui.router',
    'ngAnimate',
    'angular-loading-bar',
    'angularModalService',
    'pascalprecht.translate',
    'wegas.service.responses',
    'wegas.service.auth',
    'wegas.service.wegasTranslations',
    'wegas.directives.illustrations',
    'wegas.behaviours.expandable',
    'wegas.behaviours.confirm',
    'wegas.behaviours.modals',
    'wegas.behaviours.tools',
    'public',
    'private',
    'autologin'
])
.config(function ($stateProvider, $urlRouterProvider, cfpLoadingBarProvider, $translateProvider, WegasTranslationsProvider) {
    // Configurate loading bar
    cfpLoadingBarProvider.latencyThreshold = 1000;
    cfpLoadingBarProvider.includeSpinner = true;
    
    $stateProvider
        .state('wegas', {
            url: '/',
            views: {
                'main@': {
                    controller: 'WegasMainCtrl',
                    templateUrl: 'app/wegas.tmpl.html'
                }
            }
        })
    ;
    $urlRouterProvider.otherwise('/');
    
    $translateProvider.translations('en', WegasTranslationsProvider.getTranslations('en'));
    $translateProvider.translations('fr', WegasTranslationsProvider.getTranslations('fr'));
    WegasTranslationsProvider.default();
})
.run(function ($rootScope, $state) {
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
        $state.previous = fromState;
    });
})
.controller('WegasMainCtrl', function WegasMainCtrl($state, Auth) {
    Auth.getAuthenticatedUser().then(function(user){
    	if(user == null){
    		$state.go("wegas.public");
    	}else{
            if(user.isScenarist || user.isTrainer){
                    $state.go("wegas.private.trainer");
            }else{
                    $state.go("wegas.private.player");
            }
    	}
    });
});
