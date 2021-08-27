angular.module('public.password.directives', [])
    .directive('publicPasswordIndex', function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/public/password/directives.tmpl/index.html',
            controller: "PublicPasswordController as publicPasswordCtrl"
        };
    })
    .controller('PublicPasswordController', function PublicPasswordController($scope, $state, $stateParams, $translate, Auth, Flash) {
        "use strict";
        var publicPasswordCtrl = this;
        publicPasswordCtrl.formInfo = {
            email: ""
        };
        var remindPassword = function() {
           if (publicPasswordCtrl.formInfo.email !== "") {
                Auth.remindPassword(publicPasswordCtrl.formInfo.email).then(function(response) {
                    if (!response.isErroneous()) {
                        window.alert(response.message);
                        $scope.close();
                    } else {
                        response.flash();
                    }
                });
            } else {
                $translate('PASSWORD-FLASH-EMPTY').then(function (message) {
                    Flash.danger(message);
                });
            }
        };
        publicPasswordCtrl.remindPassword = remindPassword;
    });
