angular.module('private.trainer.sessions.new', [
    'trainer.sessions.new.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer.sessions.new', {
            url: '/new',
            views: {
                'sessions-new@wegas.private.trainer':{
                    controller: 'SessionsNewCtrl as sessionsNewCtrl',
                    templateUrl: 'app/private/trainer/sessions/sessions-new/sessions-new.tmpl.html'
                },
                'sessions-list@wegas.private.trainer': {
                    controller: 'SessionsListCtrl as sessionsListCtrl',
                    templateUrl: 'app/private/trainer/sessions/sessions.tmpl.html'
                }
            }
        })
    ;
})
.controller('SessionsNewCtrl', function SessionsNewCtrl($state) {
    var sessionsNewCtrl = this;
    console.log("Chargement new session");    
});