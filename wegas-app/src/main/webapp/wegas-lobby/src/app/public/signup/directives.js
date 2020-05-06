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
    // Directive for auto-focus
    .directive('focus', function($timeout) {
        return {
            scope: {
                trigger: '=focus'
            },
            link: function(scope, element) {
                scope.$watch('trigger', function(value) {
                    //console.log('element=',element[0],'  value=',value);
                    if (value === "true" || value === true) {
                        $timeout(function() {
                            element[0].focus();
                        }, 2000);
                    }
                });
            }
        };
    })
    .controller('PublicSignupController', function PublicSignupController($scope, $translate, $timeout, Auth, Flash, $state, TeamsModel, SessionsModel, ScenariosModel) {
        "use strict";
        var ctrl = this;
        ctrl.newUser = {
            email: "",
            username: "",
            p1: "",
            p2: "",
            firstname: "",
            lastname: "",
            language: "",
            agree: ""
        };
        /**
         * Assert the user's username is valid.
         * returns false if the username looks like a e-mail address
         *
         * @returns {Boolean} if the user is valid or not
         */
        ctrl.isUsernameValid = function() {
            var username = ctrl.newUser.username.trim();
            return !username || username.indexOf('@') < 0;
        };

        function highlightField(fieldName) {
            var field = document.getElementById(fieldName);
            field.focus();
            field.style.borderColor = "red";
            $timeout(function() {
                field.style.borderColor = "";
            }, 5000);
        }

        function highlightText(fieldName) {
            var field = document.getElementById(fieldName);
            field.style.color = "red";
            field.style.fontWeight = "bold";
            $timeout(function() {
                field.style.color = "";
                field.style.fontWeight = "";
            }, 5000);
        }

        function isValueValid(value, minLength) {
            return value && value.length >= minLength;
        }

        ctrl.signup = function() {
            if (isValueValid(ctrl.newUser.email, 1)) {
                if (ctrl.isUsernameValid()) {
                    if (isValueValid(ctrl.newUser.p1, 3)) {
                        if (ctrl.newUser.p1 === ctrl.newUser.p2) {
                            if (isValueValid(ctrl.newUser.firstname, 1) && isValueValid(ctrl.newUser.lastname, 1)) {
                                if (ctrl.newUser.agree) {

                                    Auth.signup(ctrl.newUser.email,
                                        ctrl.newUser.username,
                                        ctrl.newUser.p1,
                                        ctrl.newUser.firstname,
                                        ctrl.newUser.lastname,
                                        ctrl.newUser.agree).then(function(response) {
                                        if (response.isErroneous()) {
                                            response.flash();
                                            var msg = response.custom.messageId;
                                            if (msg.indexOf("EMAIL") >= 0) {
                                                highlightField('email');
                                            } else if (msg.indexOf("USERNAME") >= 0) {
                                                highlightField('username');
                                            }
                                        } else {
                                            // Automatic login after successful registration:
                                            Auth.login(ctrl.newUser.email, ctrl.newUser.p1).then(function(response2) {
                                                var redirect;
                                                if (response2.isErroneous()) {
                                                    response2.flash();
                                                } else {
                                                    $scope.username = $scope.p1 = "";
                                                    // clear cache after a Login. We do not want to have previous user's cache
                                                    TeamsModel.clearCache();
                                                    SessionsModel.clearCache();
                                                    ScenariosModel.clearCache();


                                                    // Pre-load teams into local cache to speed up first login:
                                                    TeamsModel.getTeams().then(function() {
                                                        // Don't leave this page until the cache is pre-populated:
                                                        $scope.close();
                                                    });
                                                    // Browser redirect is done in signup.js
                                                }

                                            });
                                        }
                                    });
                                } else {
                                    $translate('CREATE-ACCOUNT-FLASH-MUST-AGREE').then(function(message) {
                                        Flash.danger(message);
                                    });
                                    highlightText('agreeLabel');
                                }
                            } else {
                                if (ctrl.newUser.firstname && ctrl.newUser.firstname.length > 0)
                                    highlightField('lastname');
                                else
                                    highlightField('firstname');
                                $translate('CREATE-ACCOUNT-FLASH-WRONG-NAME').then(function(message) {
                                    Flash.danger(message);
                                });
                            }
                        } else {
                            highlightField('password2');
                            $translate('CREATE-ACCOUNT-FLASH-WRONG-PASS2').then(function(message) {
                                Flash.danger(message);
                            });
                        }
                    } else {
                        highlightField('password1');
                        $translate('CREATE-ACCOUNT-FLASH-WRONG-PASS').then(function(message) {
                            Flash.danger(message);
                        });
                    }
                } else {
                    highlightField('username');
                    $translate('CREATE-ACCOUNT-FLASH-WRONG-EMAIL-IN-USERNAME').then(function(message) {
                        Flash.danger(message);
                    });
                }
            } else {
                highlightField('email');
                $translate('CREATE-ACCOUNT-FLASH-WRONG-EMAIL').then(function(message) {
                    Flash.danger(message);
                });
            }
        };
    });
