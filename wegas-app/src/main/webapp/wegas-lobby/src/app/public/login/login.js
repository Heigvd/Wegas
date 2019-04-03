angular.module('public.login', [])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.public.login', {
                url: '/login',
                views: {
                    "form": {
                        controller: 'PublicLoginCtrl as publicLoginCtrl',
                        templateUrl: 'app/public/login/login.tmpl.html'
                    }
                }
            });
    })
    .controller('PublicLoginCtrl',
        function PublicLoginCtrl($scope, Flash, Auth, $state, $q, $http, $translate, TeamsModel, SessionsModel, ScenariosModel) {
            "use strict";
            $scope.showAaiLogin = false; // Default value in case of misconfiguration
            $scope.aaiLoginUrl = "";

            // Returns AAI config for the login page.
            function getAaiConfig() {
                var deferred = $q.defer();
                var url = "rest/Extended/User/Account/AaiConfig";
                $http
                    .get(ServiceURL + url, null, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    })
                    .success(function(data) {
                        if (data !== undefined) {
                            return deferred.resolve(data);
                        } else {
                            if (data.events !== undefined) {
                                console.log("WEGAS LOBBY : Could not obtain AAI config data");
                                console.log(data.events);
                            }
                        }
                        deferred.resolve();
                        return;
                    })
                    .error(function(data) {
                        if (data.events !== undefined) {
                            console.log("WEGAS LOBBY : Could not obtain AAI config data");
                            console.log(data.events);
                        }
                        deferred.resolve();
                        return;
                    });
                return deferred.promise;
            }
            ;

            getAaiConfig().then(function(config) {
                $scope.showAaiLogin = config.showButton;
                $scope.aaiLoginUrl = config.loginUrl;
            });

            $scope.init = function() {
                this.agreeCbx = false;
            };
            $scope.login = function() {
                var agreeDiv = document.getElementById('agreeDiv'),
                    recoverPasswordDiv = document.getElementById('recoverPassDiv');
                if (this.username && this.password) {
                    var ctx = this;
                    if (agreeDiv.style.display === 'block') {
                        recoverPasswordDiv.style.display = 'none';
                        if (this.agreeCbx === false) {
                            console.log("WEGAS LOBBY : User has not yet agreed to the terms of use");
                            $translate('CREATE-ACCOUNT-FLASH-MUST-AGREE').then(function(message) {
                                Flash.danger(message);
                            });
                            return;
                        }
                    } else {
                        // Make sure the checkbox is unchecked when hidden, it can help against login/password managers,
                        // which automatically activate the checkbox (e.g. Dashlane):
                        this.agreeCbx = false;
                    }
                    Auth.login(this.username, this.password, this.agreeCbx).then(function(response) {
                        var redirect, custom;

                        if (response.isErroneous()) {
                            response.flash();
                            custom = response.getCustom();
                            if (custom && custom.agreed === false) {
                                ctx.agreeCbx = false;
                                agreeDiv.style.display = 'block';
                                recoverPasswordDiv.style.display = 'none';
                            }
                        } else {
                            $scope.username = $scope.password = "";
                            $scope.agreeCbx = false;
                            // clear cache after a Login. We do not want to have previous user's cache
                            TeamsModel.clearCache();
                            SessionsModel.clearCache();
                            ScenariosModel.clearCache();


                            redirect = window.WegasHelper.getQueryStringParameter("redirect");

                            if (redirect) {
                                window.location.href = window.ServiceURL + decodeURIComponent(redirect);
                            } else {
                                // Pre-load sessions and scenarios into local cache to speed up display:
                                Auth.getAuthenticatedUser().then(function(user) {
                                    if (user.isAdmin || (user.isScenarist && user.isTrainer)) {
                                        ScenariosModel.getScenarios("LIVE");
                                        ScenariosModel.getGameModelsByStatusTypeAndPermission("SCENARIO", "LIVE", "EDIT");
                                    }
                                });
                                $state.go('wegas');
                            }
                        }
                    });
                } else {
                    $translate('LOGIN-FLASH-EMPTY').then(function(message) {
                        Flash.danger(message);
                    });
                    this.agreeCbx = false;
                    agreeDiv.style.display = 'none';
                    recoverPasswordDiv.style.display = 'block';
                }
            };
        });
