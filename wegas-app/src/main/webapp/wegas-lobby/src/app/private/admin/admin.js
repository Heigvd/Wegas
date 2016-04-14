angular.module('private.admin', [
    'wegas.models.groups',
    'private.admin.users',
    'private.admin.groups'

])
    .config(function($stateProvider) {
        "use strict";
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
        "use strict";
        var ctrl = this;
        ctrl.serviceUrl = window.ServiceURL;
        Auth.getAuthenticatedUser().then(function(user) {
            if (user) {
                if (!user.isAdmin) {
                    $state.go("wegas.private.scenarist");
                }
                $rootScope.currentRole = "ADMIN";
                $("body").removeClass("player scenarist trainer").addClass("admin");
                $rootScope.translationWorkspace = {
                    workspace: WegasTranslations.workspaces.ADMIN[$translate.use()]
                };
            }
        });
    })
    .directive('scenarioCreateUpload', function(ScenariosModel) {
        "use strict";
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
