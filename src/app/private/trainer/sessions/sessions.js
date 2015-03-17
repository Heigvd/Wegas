angular.module('private.trainer.sessions', [
    'private.trainer.sessions.manage',
    'private.trainer.sessions.users',
    'private.trainer.sessions.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer.sessions', {
            url: '/sessions',
            views: {
                'workspace@wegas.private': {
                    controller: 'TrainerCtrl as trainerCtrl',
                    templateUrl: 'app/private/trainer/sessions/sessions.tmpl.html'
                }
            }
        })
    ;
});