angular.module('private.player.sessions.users', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player.sessions.users', {
            url: '/:id/users',
            views: {
                'workspace@wegas.private':{
                    controller: 'SessionsUsersCtrl as sessionsUsersCtrl',
                    templateUrl: 'app/private/player/sessions/users/users.tmpl.html'
                }
            }
        })
    ;
})
.controller('SessionsUsersCtrl', function SessionsUsersCtrl($state, $stateParams) {
    var sessionsUsersCtrl = this;
    console.log("Loading users from session #" + $stateParams.id);
});