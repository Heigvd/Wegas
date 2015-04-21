angular
.module('private.scenarist.scenarios', [
    'private.scenarist.scenarios.directives',
    'private.scenarist.scenarios.archives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.scenarios', {
            url: '/scenarios',
            views: {
                'workspace@wegas.private': {
                    controller: 'ScenaristCtrl as scenaristCtrl',
                    templateUrl: 'app/private/scenarist/scenarios/scenarios.tmpl.html'
                }
            }
        })
    ;
});