angular.module('private.trainer', [
    'private.trainer.sessions',
    'private.trainer.sessions.new'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer', {
            url: 'trainer',
            views: {
                'workspace': {
                    controller: 'TrainerCtrl as trainerCtrl',
                    templateUrl: 'app/private/trainer/trainer.tmpl.html'
                },
                'sessions-new@wegas.private.trainer':{
                    controller: 'SessionsNewCtrl as sessionsNewCtrl',
                    templateUrl: 'app/private/trainer/sessions/sessions-new/sessions-new.tmpl.html'
                },
                'sessions-list@wegas.private.trainer':{
                    controller: 'SessionsListCtrl as sessionsListCtrl',
                    templateUrl: 'app/private/trainer/sessions/sessions.tmpl.html'
                }
            }
        })
    ;
})
.controller('TrainerCtrl', function TrainerCtrl($state) {
    var trainerCtrl = this;
    console.log("Chargement trainer view");    
});