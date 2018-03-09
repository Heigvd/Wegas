angular.module('private.admin', [
    'wegas.models.groups',
    'private.admin.users',
    'private.admin.groups',
    'private.admin.who'

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
    .controller('AdminCtrl', function AdminCtrl($rootScope, $state, Auth, $translate, $http, WegasTranslations) {
        "use strict";
        var ctrl = this;
        ctrl.serviceUrl = window.ServiceURL;
        ctrl.loading = true;
        ctrl.uploading = false;

        ctrl.fireAndForget = function(method, url) {
            switch (method) {
                case "GET":
                    $http.get(ctrl.serviceUrl + url);
                    break;
                case "DELETE":
                    $http.delete(ctrl.serviceUrl + url);
                    break;
            }
        };

        Auth.getAuthenticatedUser().then(function(user) {
            if (user) {
                if (!user.isAdmin) {
                    $state.go("wegas.private.scenarist");
                }
                $rootScope.currentRole = "ADMIN";
                $("body").removeClass("player scenarist trainer modeler").addClass("admin");
                $rootScope.translationWorkspace = {
                    workspace: WegasTranslations.workspaces.ADMIN[$translate.use()]
                };
                $http.get(ctrl.serviceUrl + "rest/Utils/build_details").then(function(response) {
                    ctrl.build_details = response.data;
                    ctrl.loading = false;
                });
            }
        });


    })
    .directive('scenarioCreateUpload', function(ScenariosModel) {
        "use strict";
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var ctrl = scope.adminCtrl;
                element.bind('change', function() {
                    ctrl.loading = true;
                    ScenariosModel.createFromJSON(element[0].files[0]).then(function(response) {
                        ctrl.loading = false;
                        response.flash();
                        element[0].value = '';
                    });
                });
            }
        };
    })
    ;
