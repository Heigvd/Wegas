angular.module('private.scenarist.scenarios.new', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.scenarios.new', {
            url: '/new',
            views: {
                'scenarios-new@wegas.private.scenarist':{
                    controller: 'ScenariosNewCtrl as scenariosNewCtrl',
                    templateUrl: 'app/private/scenarist/scenarios/scenarios-new/scenarios-new.tmpl.html'
                },
                'scenarios-list@wegas.private.scenarist': {
                    controller: 'ScenariosListCtrl as scenariosListCtrl',
                    templateUrl: 'app/private/scenarist/scenarios/scenarios.tmpl.html'
                }
            }
        })
    ;
})
.controller('ScenariosNewCtrl', function ScenariosNewCtrl($state) {
    var scenariosNewCtrl = this;
    console.log("Chargement new scenario");    
});