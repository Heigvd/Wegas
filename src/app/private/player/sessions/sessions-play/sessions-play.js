angular.module('private.player.sessions.play', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player.sessions.play', {
            url: '/:id/play',
            views: {
                'main@': {
                    controller: 'SessionsPlayCtrl as sessionsPlayCtrl',
                    templateUrl: 'app/private/player/sessions/sessions-play/sessions-play.tmpl.html'
                }
            }
        })
    ;
})
.controller('SessionsPlayCtrl', function SessionsPlayCtrl($state, $stateParams) {
    var sessionsPlayCtrl = this;
    console.log("Redirect to session No" + $stateParams.id);
});