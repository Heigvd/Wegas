angular
.module('private.scenarist.history', [
    'private.scenarist.history.directives'
    ])
.config(function ($stateProvider) {
    $stateProvider
    .state('wegas.private.scenarist.history', {
        url: '/:scenarioId/history',
        views: {
            'workspace@wegas.private': {
                controller: 'HistoryCtrl as historyCtrl',
                templateUrl: 'app/private/scenarist/history/tmpl/history.html'
            }
        }
    });
})
.controller('HistoryCtrl', function HistoryCtrl($state, Auth, ViewInfos, $scope) {
    var historyCtrl = this;
    Auth.getAuthenticatedUser().then(function(user){
        if(user != null){
            ViewInfos.editName("Scenarist workspace");
        }
    });
});