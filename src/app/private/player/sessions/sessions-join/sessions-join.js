angular.module('private.player.sessions.join', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player.sessions.join', {
            url: '/join',
            views: {
                'sessions-new@wegas.private.player':{
                    controller: 'SessionsJoinCtrl as sessionsJoinCtrl',
                    templateUrl: 'app/private/player/sessions/sessions-join/sessions-join.tmpl.html'
                },
                'sessions-list@wegas.private.player': {
                    controller: 'SessionsListCtrl as sessionsListCtrl',
                    templateUrl: 'app/private/player/sessions/sessions.tmpl.html'
                }
            }
        })
    ;
})
.controller('SessionsJoinCtrl', function SessionsJoinCtrl($state) {
    var sessionsJoinCtrl = this;
    console.log("Loading new session");
});