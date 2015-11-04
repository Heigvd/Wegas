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
        function PublicLoginCtrl($scope, Flash, Auth, $state, $translate, TeamsModel, SessionsModel, ScenariosModel) {
            "use strict";
            $scope.login = function() {
                if (this.username && this.password) {
                    Auth.login(this.username, this.password).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                        } else {
                            $scope.username = $scope.password = "";
                            // clear cache after a Login. We do not want to have previous user's cache
                            TeamsModel.clearCache();
                            SessionsModel.clearCache();
                            ScenariosModel.clearCache();
                            $state.go('wegas');
                        }
                    });
                } else {
                    $translate('LOGIN-FLASH-EMPTY').then(function(message) {
                        Flash.danger(message);
                    });
                }
            };
        });