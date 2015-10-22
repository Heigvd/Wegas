angular.module('private.player', [
    'private.player.join',
    'private.player.team',
    'private.player.directives',
    'public.login'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.player', {
                url: 'player',
                views: {
                    'workspace': {
                        controller: 'PlayerCtrl as playerCtrl',
                        templateUrl: 'app/private/player/player.tmpl.html'
                    }
                }
            })
            .state('wegas.private.guest', {
                url: 'guest',
                views: {
                    'workspace': {
                        controller: 'PlayerCtrl as playerCtrl',
                        templateUrl: 'app/private/player/player.tmpl.html'
                    },
                    'join@wegas.private.guest': {
                        controller: 'PublicLoginCtrl as publicLoginCtrl',
                        templateUrl: 'app/public/login/login.tmpl.html'
                    }
                }
            });
    })
    .controller('PlayerCtrl', function PlayerCtrl($rootScope, $state, Auth, WegasTranslations, $translate) {
        "use strict";
        Auth.getAuthenticatedUser().then(function(user) {
            if (user.isGuest) {
                $state.go("wegas.private.guest");
            } else {
                $state.go("wegas.private.player");
            }
            $("body").removeClass("admin scenarist trainer").addClass("player");
            $rootScope.translationWorkspace = {
                workspace: WegasTranslations.workspaces.PLAYER[$translate.use()]
            };
        });
    });
