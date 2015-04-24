angular
    .module('private.profile.directives', [

    ])
    .directive('profileIndex', function(UsersModel) {
        return {
            templateUrl: 'app/private/profile/tmpl/profile-index.html',
            controller: function($scope, $stateParams, $sce, $rootScope, Auth, Flash) {
                var ctrl = this;
                $scope.user = {};
                $scope.originalUser = false
                Auth.getAuthenticatedUser().then(function(user) {
                    if (user !== false) {
                        UsersModel.getFullUser(user.id).then(function(response) {
                            if (response.isErroneous()) {
                                response.flash();
                            } else {
                                $scope.user = response.data;
                                if ($scope.originalUser === false) {
                                    $scope.originalUsername = $scope.user.account.lastname + ' ' + $scope.user.account.firstname;
                                }
                            }
                        });
                    } else {
                        Flash('danger', 'Unable to load user informations...');
                    }
                });

                ctrl.updateInformations = function() {
                    UsersModel.updateUser($scope.user.account).then(function(response) {
                        response.flash();
                        $scope.user.password = '';
                        $scope.user.password2 = '';
                    });
                }


            }
        };
    })
    .directive('profileContent', function() {
        return {
            templateUrl: 'app/private/profile/tmpl/profile-content.html',
            scope: true,
            require: "^profileIndex",
            link: function($scope, element, attrs, parentCtrl) {

                $scope.$watch(function() {
                    return $scope.$parent.user
                }, function(n, o) {
                    $scope.user = n;
                });
                $scope.updateInformations = function() {
                    parentCtrl.updateInformations();
                }

            }
        };
    })