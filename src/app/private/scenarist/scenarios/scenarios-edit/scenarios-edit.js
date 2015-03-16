angular.module('private.scenarist.scenarios.edit', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.scenarios.edit', {
            url: '/:id/edit',
            views: {
                'main@': {
                    controller: 'ScenariosEditCtrl as scenariosEditCtrl',
                    templateUrl: 'app/private/scenarist/scenarios/scenarios-edit/scenarios-edit.tmpl.html'
                }
            }
        })
    ;
})
.controller('ScenariosEditCtrl', function ScenariosEditCtrl($state, $stateParams) {
    var scenariosEditCtrl = this;
    console.log("Redirect to scenario No" + $stateParams.id);  
});