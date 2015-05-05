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
.controller('PlayerCtrl', function PlayerCtrl($state, Auth, ViewInfos) {
    var playerCtrl = this;
    Auth.getAuthenticatedUser().then(function(user){
        if(user != null){
            ViewInfos.editName("Player workspace");
        }
    });
});