angular
.module('private.profile.directives', [

])
.directive('profileIndex', function(UsersModel){
    return {

        templateUrl: 'app/private/profile/tmpl/profile-index.html',
        controller : function($scope, $stateParams, $sce, $rootScope, Auth, flash) {
            var ctrl = this;
            $scope.user = {};
            $scope.originalUser = false
            Auth.getAuthenticatedUser().then(function (user) {
                if (user !== false) {
                    UsersModel.getUser(user.id).then(function (fulluser) {
                        if (fulluser !== false) {
                            $scope.user = fulluser;
                            if ($scope.originalUser === false) {
                                $scope.originalUsername = fulluser.lastname + ' ' + fulluser.firstname;
                            }
                        } else {
                            flash('error', 'Unable to load user informations...');
                        }
                    });
                } else {
                    flash('error', 'Unable to load user informations...');
                }
            });

            ctrl.updateInformations = function () {

                if ($scope.user.password == $scope.user.password2) {

                    UsersModel.updateUser($scope.user).then(function (result) {
                        if (result !== false) {
                            $scope.user.password = '';
                            flash('Profile updated');
                        } else {

                        }
                    })

                }  else {
                    flash('error', 'Passwords do not matches');
                }
            }

        }
    };
})
.directive('profileContent', function(){
    return {
        templateUrl: 'app/private/profile/tmpl/profile-content.html',
        scope: true,
        require: "^profileIndex",
        link : function($scope, element, attrs, parentCtrl) {

            $scope.$watch(function() {
                return $scope.$parent.user
            } , function(n,o) {
                $scope.user = n;
            });
            $scope.updateInformations = function() {
                parentCtrl.updateInformations();
            }

        }
    };
})