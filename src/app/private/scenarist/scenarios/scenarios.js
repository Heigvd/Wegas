angular
.module('private.scenarist.scenarios', [
    'private.scenarist.scenarios.directives'
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