angular.module('private.player.sessions', [
    'private.player.session.join',
    'private.player.sessions.users',
    'private.player.sessions.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player.sessions', {
            url: '/sessions',
            views: {
                'workspace@wegas.private': {
                    controller: 'PlayerCtrl as playerCtrl',
                    templateUrl: 'app/private/player/sessions/sessions.tmpl.html'
                }
            }
        })
    ;
});