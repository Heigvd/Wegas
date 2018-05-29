window.ServiceURL = "";

window.Storage.prototype.setObject = function(key, value) {
    "use strict";
    this.setItem(key, JSON.stringify(value));
};

window.Storage.prototype.getObject = function(key) {
    "use strict";
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

/* 
 * erk...
 */
window.WegasHelper = {
    getQueryStringParameter: function(name) {
        var qs = window.location.search.replace("?", "").split("&"), i, value = null, param;
        for (i in qs) {
            if (qs.hasOwnProperty(i)) {
                param = qs[i].split("=");
                if (param[0] === name) {
                    return param[1];
                }
            }
        }
    }
};

angular.module('Wegas', [
    'flash',
    'ui.router',
    'ngAnimate',
    'angularModalService',
    'pascalprecht.translate',
    'wegas.service.responses',
    'wegas.service.auth',
    'wegas.service.wegasTranslations',
    'wegas.directives.illustrations',
    'wegas.directives.content.loading',
    'wegas.directives.search.tool',
    'wegas.behaviours.expandable',
    'wegas.behaviours.confirm',
    'wegas.behaviours.modals',
    'wegas.behaviours.tools',
    'public',
    'private',
    'autologin'
])
    .config(function($stateProvider, $urlRouterProvider, $translateProvider, WegasTranslationsProvider) {
        "use strict";
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
    .run(function($rootScope, $state) {
        "use strict";
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState) {
            $state.previous = fromState;
        });
    })
    .controller('WegasMainCtrl', function WegasMainCtrl($state, Auth) {
        "use strict";
        Auth.getAuthenticatedUser().then(function(user) {
            if (user === null) {
                $state.go("wegas.public");
            } else {
                if (user.isGuest) {
                    Auth.logout().then(function() {
                        $state.go("wegas.public.login");
                    });
                } else if (user.isAdmin || user.isScenarist || user.isTrainer) {
                    $state.go("wegas.private.trainer");
                } else {
                    $state.go("wegas.private.player");
                }
            }
        });
    });
