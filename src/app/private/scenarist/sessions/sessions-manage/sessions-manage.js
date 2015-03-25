angular.module('private.scenarist.sessions.manage', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.sessions.manage', {
            url: '/:id/manage',
            views: {
                'main@': {
                    controller: 'SessionsManageCtrl as sessionsManageCtrl',
                    templateUrl: 'app/private/scenarist/sessions/sessions-manage/sessions-manage.tmpl.html'
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