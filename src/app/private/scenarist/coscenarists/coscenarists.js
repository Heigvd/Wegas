angular.module('private.scenarist.coscenarists', [
    'private.scenarist.coscenarists.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.coscenarists', {
            url: '/:scenarioId/coscenarists',
            views: {
                'workspace@wegas.private': {
                    controller: 'CoscenaristsCtrl as coscenaristsCtrl',
                    templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists.tmpl.html'
                }
            }
        });
})
.controller('CoscenaristsCtrl', function CoscenaristsCtrl($state, Auth, ViewInfos, $scope) {
    var scenaristCtrl = this;
    Auth.getAuthenticatedUser().then(function(user){
        if(user != null){
            ViewInfos.editName("Scenarist workspace");
        }
    });
});