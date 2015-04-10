angular.module('private.scenarist.sessions.users', [])
    .config(function($stateProvider) {
        $stateProvider
            .state('wegas.private.scenarist.sessions.users', {
                url: '/:id/users',
                views: {
                    'workspace@wegas.private': {
                        controller: 'SessionsUsersCtrl as sessionsUsersCtrl',
                        templateUrl: 'app/private/scenarist/sessions/users/users.tmpl.html'
                    }
                }
            });
    })
    .controller('SessionsUsersCtrl', function SessionsUsersCtrl($state, $stateParams) {
        var sessionsUsersCtrl = this;
        console.log("Loading users from session #" + $stateParams.id);
    });