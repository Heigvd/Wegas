angular.module('private', [
    'wegas.models.permissions',
    'wegas.models.groups',
    'wegas.models.users',
    'wegas.models.sessions',
    'wegas.models.scenarios',
    'wegas.models.teams',
    'wegas.service.pusher',
    'pascalprecht.translate',
    'wegas.service.wegasTranslations',
    'private.player',
    'private.profile',
    'private.trainer',
    'private.scenarist',
    'private.admin',
    'private.logout',
    'private.directives'
])
.config(function ($stateProvider) {
    "use strict";
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
        });

})
.controller('PrivateCtrl', function PrivateCtrl($rootScope, $state, Auth, $translate, $scope, $q, $http, $sce, WegasPusher) {
    "use strict";
    var privateCtrl = this;

    // Temporary setting to prevent display flickering:
    $scope.user = { hasAgreed: true };
    $scope.frameUrl = trustSrc("about:blank");

    $scope.updateUserAgreement = function() {
        var deferred = $q.defer(),
            user = $scope.user;

        var url = "rest/Extended/User/Account/SetAgreed/" + user.accountId;
        $http
            .post(ServiceURL + url, null, {
                "headers": {
                    "managed-mode": "true"
                }
            })
            // @TODO: simplify success and error handling:
            .success(function (data) {
                if (data.events !== undefined && data.events.length === 0) {
                    $scope.user.hasAgreed = true;
                } else {
                    if (data.events !== undefined) {
                        console.log("WEGAS LOBBY : Error while updating profile (agreement time)");
                        console.log(data.events);
                    }
                }
                deferred.resolve();
                return;
            })
            .error(function (data) {
                if (data.events !== undefined) {
                    console.log("WEGAS LOBBY : Error while updating profile (agreement time)");
                    console.log(data.events);
                }
                deferred.resolve();
                return;
            });
        return deferred.promise;
    };

    function trustSrc (src) {
        return $sce.trustAsResourceUrl(src);
    };

    function getCommonsLang () {
        var frList = ['fr', 'fr-fr', 'fr-ch', 'fr-mc', 'fr-ca', 'fr-lu'],
            isFr = false,
            language = window.navigator.userLanguage || window.navigator.language;
        language = language.toLowerCase();
        frList.forEach(function(frCode) {
            if (language.toLowerCase() === frCode) {
                isFr = true;
            }
        });
        return isFr ? 'fr' : 'en';
    };
    
    //privateCtrl.loading = 0;

    Auth.getAuthenticatedUser().then(function(user){
        $scope.user = user;
        if(user === null){
            $state.go("wegas.public");
        } else {
            console.log("starting Pusher");
            WegasPusher.start();
            var config = localStorage.getObject("wegas-config"),
                lang = (config && config.commons && config.commons.language) || $rootScope.language || getCommonsLang();
            if (!config) {
                config = {};
            }
            if (!config.users) {
                config.users = {};
            }
            if (!config.commons) {
                config.commons = { language: lang };
            }
            if (config.users[user.email]) {
                if (config.commons.language !== config.users[user.email].language) {
                    config.commons.language = config.users[user.email].language;
                    localStorage.setObject("wegas-config", config);
                }
                $translate.use(config.users[user.email].language);
            } else {
                config.users[user.email] = {
                    language: config.commons.language
                };
                localStorage.setObject("wegas-config", config);
                $translate.use(config.users[user.email].language);
            }
        }
        if (!user.hasAgreed) {
            $scope.frameUrl = trustSrc("https://www.albasim.ch/en/terms-of-use/");
        }
    });
});
