angular.module('private.scenarist.scenarios', [
    'private.scenarist.scenarios.new',
    'private.scenarist.scenarios.edit',
    'private.scenarist.scenarios.users',
    'private.scenarist.scenarios.download'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.scenarios', {
            url: '/scenarios',
            views: {
                'scenarios-new':{
                    controller: 'ScenariosNewCtrl as scenariosNewCtrl',
                    templateUrl: 'app/private/scenarist/scenarios/scenarios-new/scenarios-new.tmpl.html'
                },
                'scenarios-list': {
                    controller: 'ScenariosListCtrl as scenariosListCtrl',
                    templateUrl: 'app/private/scenarist/scenarios/scenarios.tmpl.html'
                }
            }
        })
    ;
})
.controller('ScenariosListCtrl', function ScenariosListCtrl($state) {
    var scenariosListCtrl = this;
    console.log("Chargement scenarist scenarios list");    
});