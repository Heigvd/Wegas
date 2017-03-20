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

            // Tells if the AAI login button should be displayed.
            // Idea: use this function to obtain the URL of the AAI login page.
            function isAaiEnabled() {
                var deferred = $q.defer();
                var url = "rest/Extended/User/Account/AaiEnabled";
                $http
                    .get(ServiceURL + url, null, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    })
                    .success(function (data) {
                        if (data !== undefined) {
                            return deferred.resolve(data);
                        } else {
                            if (data.events !== undefined) {
                                console.log("WEGAS LOBBY : Could not verify AAI access");
                                console.log(data.events);
                            }
                        }
                        deferred.resolve();
                        return;
                    })
                    .error(function (data) {
                        if (data.events !== undefined) {
                            console.log("WEGAS LOBBY : Could not verify AAI access");
                            console.log(data.events);
                        }
                        deferred.resolve();
                        return;
                    });
                return deferred.promise;
            };

            isAaiEnabled().then(function(isEnabled){
                $scope.showAaiLogin = isEnabled;
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
                            $translate('CREATE-ACCOUNT-FLASH-MUST-AGREE').then(function (message) {
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
                        if (response.isErroneous()) {
                            response.flash();
                            var custom = response.getCustom();
                            if (custom && custom.agreed===false){
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
                            // Pre-load sessions and scenarios into local cache to speed up admin sessions:
                            Auth.getAuthenticatedUser().then(function(user) {
                                if (user.isAdmin) {
                                    SessionsModel.getSessions("LIVE");
                                    ScenariosModel.getScenarios("LIVE");
                                }
                            });
                            $state.go('wegas');
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
