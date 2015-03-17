angular.module('private.trainer.sessions', [
    'private.trainer.sessions.new',
    'private.trainer.sessions.manage',
    'private.trainer.sessions.users'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer.sessions', {
            url: '/sessions',
            views: {
                'sessions-new':{
                    controller: 'SessionsNewCtrl as sessionsNewCtrl',
                    templateUrl: 'app/private/trainer/sessions/sessions-new/sessions-new.tmpl.html'
                },
                'sessions-list': {
                    controller: 'SessionsListCtrl as sessionsListCtrl',
                    templateUrl: 'app/private/trainer/sessions/sessions.tmpl.html'
                }
            }
        })
    ;
})
.controller('SessionsListCtrl', function SessionsListCtrl($state, SessionsModel) {
    var sessionsListCtrl = this;
    SessionsModel.getManagedSessions().then(function(sessions){
        sessionsListCtrl.sessions = sessions;
    });
    console.log("Chargement trainer sessions list");    
});