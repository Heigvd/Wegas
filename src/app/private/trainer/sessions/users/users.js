angular.module('private.trainer.sessions.users', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer.sessions.users', {
            url: '/:id/users',
            views: {
                'workspace@wegas.private':{
                    controller: 'SessionsUsersCtrl as sessionsUsersCtrl',
                    templateUrl: 'app/private/trainer/sessions/users/users.tmpl.html'
                }
            }
        })
    ;
})
.controller('SessionsUsersCtrl', function SessionsUsersCtrl($state, $stateParams) {
    var sessionsUsersCtrl = this;
    console.log("Chargement des users de la session No " + $stateParams.id);    
});