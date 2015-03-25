angular.module('private.scenarist.sessions', [
    'private.scenarist.sessions.manage',
    'private.scenarist.sessions.users',
    'private.scenarist.sessions.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.sessions', {
            url: '/sessions',
            views: {
                'workspace@wegas.private': {
                    controller: 'ScenaristCtrl as scenaristCtrl',
                    templateUrl: 'app/private/scenarist/sessions/sessions.tmpl.html'
                }
            }
        })
    ;
});