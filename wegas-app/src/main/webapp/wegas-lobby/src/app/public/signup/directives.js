angular.module('public.signup.directives', [])
    .directive('publicSignupIndex', function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            controller: 'PublicSignupController as publicSignupCtrl',
            templateUrl: 'app/public/signup/directives.tmpl/index.html'
        };
    })
    .controller('PublicSignupController', function PublicSignupController($scope, $translate, Auth, Flash) {
        "use strict";
        var ctrl = this;
        ctrl.newUser = {
            email: "",
            username: "",
            p1: "",
            p2: "",
            firstname: "",
            lastname: ""
        };
        ctrl.signup = function() {
            if (ctrl.newUser.p1 && ctrl.newUser.p1.length > 3) {
                if (ctrl.newUser.firstname && ctrl.newUser.firstname.length > 0 && ctrl.newUser.lastname &&
                    ctrl.newUser.lastname.length > 0) {
                    if (ctrl.newUser.p1 === ctrl.newUser.p2) {
                        Auth.signup(ctrl.newUser.email,
                            ctrl.newUser.username,
                            ctrl.newUser.p1,
                            ctrl.newUser.firstname,
                            ctrl.newUser.lastname).then(function(response) {
                            response.flash();
                            if (!response.isErroneous()) {
                                $scope.close();
                            }
                        });
                    } else {
                        $translate('CREATE-ACCOUNT-FLASH-WRONG-PASS2').then(function(message) {
                            Flash.danger(message);
                        });
                    }
                } else {
                    $translate('CREATE-ACCOUNT-FLASH-WRONG-NAME').then(function(message) {
                        Flash.danger(message);
                    });
                }
            } else {
                $translate('CREATE-ACCOUNT-FLASH-WRONG-PASS').then(function(message) {
                    Flash.danger(message);
                });
            }
        };
    });
