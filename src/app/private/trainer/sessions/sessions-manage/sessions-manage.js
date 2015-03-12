angular.module('private.trainer.sessions.manage', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer.sessions.manage', {
            url: '/:id/manage',
            views: {
                'main@': {
                    controller: 'SessionsManageCtrl as sessionsManageCtrl',
                    templateUrl: 'app/private/trainer/sessions/sessions-manage/sessions-manage.tmpl.html'
                }
            }
        })
    ;
})
.controller('SessionsManageCtrl', function SessionsManageCtrl($state, $stateParams) {
    var sessionsManageCtrl = this;
    console.log("Redirect to session No" + $stateParams.id);  
    console.log()  
});