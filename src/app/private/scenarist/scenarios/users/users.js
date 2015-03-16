angular.module('private.scenarist.scenarios.users', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.scenarist.scenarios.users', {
            url: '/:id/users',
            views: {
                'workspace@wegas.private':{
                    controller: 'ScenariosUsersCtrl as scenariosUsersCtrl',
                    templateUrl: 'app/private/scenarist/scenarios/users/users.tmpl.html'
                }
            }
        })
    ;
})
.controller('ScenariosUsersCtrl', function ScenariosUsersCtrl($state, $stateParams) {
    var scenariosUsersCtrl = this;
    console.log("Chargement des users du scenarios No " + $stateParams.id);    
});