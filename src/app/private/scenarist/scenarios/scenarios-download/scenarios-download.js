angular.module('private.scenarist.scenarios.download', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.scenarios.download', {
            url: '/:id/download',
            views: {
                'workspace@wegas.private': {
                    controller: 'ScenariosDownloadCtrl as scenariosDownloadCtrl',
                    templateUrl: 'app/private/scenarist/scenarios/scenarios-download/scenarios-download.tmpl.html'
                }
            }
        })
    ;
})
.controller('ScenariosDownloadCtrl', function ScenariosDownloadCtrl($state, $stateParams) {
    var scenariosDownloadCtrl = this;
    console.log("Download scenarios No" + $stateParams.id);  
});