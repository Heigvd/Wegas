angular.module('private.player', [
    'private.player.join',
    'private.player.team',
    'private.player.directives',
    'public.login',
    'ngSanitize'
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
    .controller('PlayerCtrl', function PlayerCtrl($rootScope, $scope, $state, Auth, WegasTranslations, $translate) {
        "use strict";
        /*
        $scope.message = "";

        var createLoginLink = function(val){ // Adds a safe HTML onclick attribute to the words "login" or "connecter" (needs parameter $sce to function PlayerCtrl)
         var link = "<a onclick=\"$(\'#login-form\').slideToggle()\" style=\"text-decoration:underline; cursor:pointer; \">";
            var msg = val;
            if ($translate.use()=='fr'){
                msg = msg.replace('connecter', link+'connecter</a>');
            } else {
                msg = msg.replace('login', link + 'login</a>');
            }
            return $sce.trustAsHtml(msg);
        };
        */

        Auth.getAuthenticatedUser().then(function(user) {
            if (user.isGuest) {
                /*
                var detach;
                $translate('UPGRADE-ACCOUNT').then(function(val) {
                    $scope.message = val;
                });
                detach = $rootScope.$on('$translateChangeSuccess', function () {
                    $translate('UPGRADE-ACCOUNT').then(function(val) {
                        $scope.message = val;
                    });
                });
                $scope.$on("$destroy", function(){
                    detach();
                });
                */
                $state.go("wegas.private.guest");
            } else if ($state.current.name === 'wegas.private.guest') {
                $state.go("wegas.private.player");
            }
            $("body").removeClass("admin scenarist trainer modeler").addClass("player");

            if (user.isGuest) {
                $("body").addClass("guest");
            } else {
                $("body").removeClass("guest");
            }

            $rootScope.translationWorkspace = {
                workspace: WegasTranslations.workspaces.PLAYER[$translate.use()]
            };
        });
    });
