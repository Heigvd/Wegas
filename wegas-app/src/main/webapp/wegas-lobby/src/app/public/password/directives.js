angular.module('public.password.directives', [])
    .directive('publicPasswordIndex', function() {
        return {
        	scope: {
                close: "&"
            },
            templateUrl: 'app/public/password/directives.tmpl/index.html',
            controller: "PublicPasswordController as publicPasswordCtrl"
        };
    })
    .controller('PublicPasswordController', function PublicPasswordController($scope, $state, $stateParams, Auth, Flash) {
        var publicPasswordCtrl = this;
        publicPasswordCtrl.formInfo = {
            email: ""
        };
        var remindPassword = function() {
           if (publicPasswordCtrl.formInfo.email != "") {
                Auth.remindPassword(publicPasswordCtrl.formInfo.email).then(function(response) {
                    response.flash();
                    if (!response.isErroneous()) {
                        $scope.close();
                    }
                });
            } else {
                Flash.danger('Please, enter an email');
            }
        }
        publicPasswordCtrl.remindPassword = remindPassword;
    });