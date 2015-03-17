angular.module('private.player', [
    'private.player.sessions',
    'private.player.sessions.join'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player', {
            url: 'player',
            views: {
                'workspace': {
                    controller: 'PlayerCtrl as playerCtrl',
                    templateUrl: 'app/private/player/player.tmpl.html'
                },
                'sessions-join@wegas.private.player':{
                    controller: 'SessionsNewCtrl as sessionsNewCtrl',
                    templateUrl: 'app/private/player/sessions/sessions-join/sessions-join.tmpl.html'
                },
                'sessions-list@wegas.private.player':{
                    controller: 'SessionsListCtrl as sessionsListCtrl',
                    templateUrl: 'app/private/player/sessions/sessions.tmpl.html'
                }
            }
        })
    ;
})
.controller('PlayerCtrl', function PlayerCtrl($state, ViewInfos, SessionsModel) {
    var playerCtrl = this;
    console.log("Chargement player view");  
    ViewInfos.editName("Player workspace");  
    playerCtrl.name = ViewInfos.name;
    SessionsModel.getPlayedSessions().then(function(sessions){
        console.log(sessions);
    });

});

