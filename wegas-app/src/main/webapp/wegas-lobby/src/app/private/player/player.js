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
    .controller('PlayerCtrl', function PlayerCtrl($rootScope, $scope, $state, Auth, WegasTranslations, $translate, $timeout) {
        "use strict";
        $scope.message = "";
        Auth.getAuthenticatedUser().then(function(user) {
            var detach;
            if (user.isGuest) {
                $translate('UPDGRADE-ACCOUNT').then(function(val) {
                    $scope.message = val;
                });
                detach = $rootScope.$on('$translateChangeSuccess', function () {
                    $translate('UPDGRADE-ACCOUNT').then(function(val) {
                        $scope.message = val;
                    });
                });
                $scope.$on("$destroy", function(){
                    detach();
                });
                $state.go("wegas.private.guest");
            } else if ($state.current.name === 'wegas.private.guest') {
                $state.go("wegas.private.player");
            }
            $("body").removeClass("admin scenarist trainer").addClass("player");

            if (user.isGuest) {
                $("body").addClass("guest");
                // Make the start button green after a slight delay :-)
                $timeout(function () {
                    $(".button.button--small.button--label-off.button--play").css({'background-color': 'green'});
                }, 1000);
            } else {
                $("body").removeClass("guest");
            }

            $rootScope.translationWorkspace = {
                workspace: WegasTranslations.workspaces.PLAYER[$translate.use()]
            };
        });
    });
