angular.module('private.player.sessions.join', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player.sessions.join', {
            url: '/:id/join',
            views: {
                'main@': {
                    controller: 'SessionsPlayCtrl as sessionsPlayCtrl',
                    templateUrl: 'app/private/player/sessions/sessions-join/sessions-join.tmpl.html'
                }
            }
        })
    ;
})
.controller('SessionsPlayCtrl', function SessionsPlayCtrl($state, $stateParams) {
    var sessionsPlayCtrl = this;
    console.log("Redirect to session No" + $stateParams.id);
});