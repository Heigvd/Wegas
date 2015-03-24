angular.module('private.trainer.sessions.users', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer.sessions.users', {
            url: '/:id/users',
            views: {
                'workspace@wegas.private':{
                    controller: 'TrainerCtrl as trainerCtrl',
                    templateUrl: 'app/private/trainer/sessions/users/users.tmpl.html'
                }
            }
        })
    ;
});