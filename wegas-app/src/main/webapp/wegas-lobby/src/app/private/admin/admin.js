angular.module('private.admin', [
    'wegas.models.groups',
    'private.admin.users',
    'private.admin.groups'

])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.admin', {
            url: 'admin',
            views: {
                'workspace': {
                    controller: 'AdminCtrl as adminCtrl',
                    templateUrl: 'app/private/admin/admin.tmpl.html'
                }
            }
        })
    ;
})
.controller('AdminCtrl', function AdminCtrl($rootScope, $state, Auth, $translate, WegasTranslations) {
    var ctrl = this;
        ctrl.serviceUrl = ServiceURL;
    Auth.getAuthenticatedUser().then(function(user){
        if(user != null){
            if(!user.isAdmin){
                $state.go("wegas.private.scenarist");
            }
            $rootScope.translationWorkspace = {workspace: WegasTranslations.workspaces['ADMIN'][$translate.use()]};
        }
    });
})
.directive('scenarioCreateUpload', function(ScenariosModel) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.bind('change', function() {
                    ScenariosModel.createFromJSON(element[0].files[0]).then(function(response) {
                        response.flash();
                        element[0].value = '';
                    });
                });
            }
        };
    })
;