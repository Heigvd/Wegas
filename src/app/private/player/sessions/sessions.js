angular.module('private.player.sessions', [
    'private.player.sessions.join',
    'private.player.sessions.play',
    'private.player.sessions.team'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player.sessions', {
            url: '/sessions',
            views: {
                'sessions-join':{
                    controller: 'SessionsJoinCtrl as sessionsJoinCtrl',
                    templateUrl: 'app/private/player/sessions/sessions-join/sessions-join.tmpl.html'
                },
                'sessions-list': {
                    controller: 'SessionsListCtrl as sessionsListCtrl',
                    templateUrl: 'app/private/player/sessions/sessions.tmpl.html'
                }
            }
        })
    ;
})
.controller('SessionsListCtrl', function SessionsListCtrl($state) {
    var sessionsListCtrl = this;
    console.log("Chargement player sessions list");    
});