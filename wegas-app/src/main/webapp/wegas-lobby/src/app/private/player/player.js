angular.module('private.player', [
    'private.player.join',
    'private.player.team',
    'private.player.directives'
])
.config(function ($stateProvider) {
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
    ;
})
.controller('PlayerCtrl', function PlayerCtrl($rootScope, $state, Auth, WegasTranslations, $translate) {
    Auth.getAuthenticatedUser().then(function(user){
        $("body").removeClass("admin scenarist trainer").addClass("player");
        $rootScope.translationWorkspace = {workspace: WegasTranslations.workspaces['PLAYER'][$translate.use()]};
    });
});