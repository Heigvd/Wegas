angular.module('private.player.sessions.team', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player.sessions.team', {
            url: '/:id/team',
            views: {
                'workspace@wegas.private':{
                    controller: 'SessionsTeamCtrl as sessionsTeamCtrl',
                    templateUrl: 'app/private/player/sessions/team/team.tmpl.html'
                }
            }
        })
    ;
})
.controller('SessionsTeamCtrl', function SessionsTeamCtrl($state, $stateParams) {
    var sessionsTeamCtrl = this;
    console.log("Chargement des users de la session No " + $stateParams.id);    
});