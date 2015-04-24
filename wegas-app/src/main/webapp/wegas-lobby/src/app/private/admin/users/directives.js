angular.module('private.admin.users.directives', [
    'wegas.behaviours.repeat.autoload'
])
    .directive('adminUsersIndex', function() {
        return {
            templateUrl: 'app/private/admin/users/directives.tmpl/index.html',
            controller: "AdminUsersIndexController as AdminUsersIndexCtrl"
        };
    })
    .controller("AdminUsersIndexController", function AdminUsersIndexController($scope, $rootScope, Flash, UsersModel) {
        var ctrl = this;
        $scope.maxUsersDisplayed = null;
        $scope.users = [];
        initMaxUsersDisplayed = function() {
            if ($scope.users.length > 12) {
                $scope.maxUsersDisplayed = 10;
            } else {
                $scope.maxUsersDisplayed = $scope.users.length;
            }
        };

        ctrl.updateDisplay = function() {
            if ($scope.maxUsersDisplayed == null) {
                initMaxUsersDisplayed();
            }
            if ($scope.maxUsersDisplayed >= $scope.users.length) {
                $scope.maxUsersDisplayed = $scope.users.length;
            } else {
                $scope.maxUsersDisplayed += 15;
            }

        };


        ctrl.updateUsersList = function() {
            UsersModel.getUsers().then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    $scope.users = response.data || [];
                    ctrl.updateDisplay();
                }
            });
        };
        ctrl.updateDisplay();
        ctrl.updateUsersList();

        $scope.deleteUser = function(id) {
            console.info('Will remove user')
            UsersModel.getUser(id).then(function(response) {
                if (!response.isErroneous()) {
                    var user = response.data;
                    UsersModel.deleteUser(user).then(function (response) {
                        response.flash();
                        ctrl.updateUsersList();
                    });
                }
            });
        };

        $rootScope.$on('changeLimit', function(e, hasNewData) {
            if (hasNewData) {
                ctrl.updateUsersList();
            }
        });

    })
    .directive('adminUsersList', function(Flash) {
        return {
            templateUrl: 'app/private/admin/users/directives.tmpl/list.html',
            scope: false,
            require: "^adminUsersIndex",
            link: function(scope, element, attrs, parentCtrl) {
                // TODO
            }
        };
    })
    .directive('adminEditUserForm', function(UsersModel, RolesModel, $stateParams) {
        return {
            templateUrl: 'app/private/admin/users/directives.tmpl/edit.html',
            link: function(scope, element, attrs, parentCtrl) {

                UsersModel.getFullUser($stateParams.id).then(function(response) {
                    if (!response.isErroneous()) {
                        scope.user = response.data;
                    }
                });
                scope.save = function () {
                    UsersModel.updateUser(scope.user.account).then(function (response) {
                        if (!response.isErroneous()) {
                            response.flash();
                        }
                    });
                }
            }
        }
    })
    .directive('adminUserRoles', function(RolesModel) {
        return {
            templateUrl: "app/private/admin/users/directives.tmpl/roles.html",
            scope: {
                user: '='
            },
            link: function(scope, element, attrs, parentCtrl) {
                RolesModel.getRoles().then(function(response) {
                    if (!response.isErroneous()) {
                        scope.roles = response.data;
                    } else {
                        response.flash();
                    }
                });

                // Create a new
                scope.addARole = function() {
                    var new_role = angular.copy(this.roles[0])
                    scope.user.account.roles.push(new_role);
                }
            }
        }
    })
    .directive('adminUserRole', function(RolesModel) {
        return {
            templateUrl: "app/private/admin/users/directives.tmpl/role.html",
            scope: {
                currentRole: '=',
                user: '='
            },
            link: function(scope, element, attrs, parentCtrl) {
                RolesModel.getRoles().then(function(response) {
                    if (!response.isErroneous()) {
                        scope.roles = response.data;
                    } else {
                        response.flash();
                    }
                });

                scope.selectedRole = scope.currentRole;

                // Updating user roles when user select another role in the list
                scope.$watch('selectedRole', function() {
                    var index = scope.user.account.roles.indexOf(scope.currentRole);
                    if (index > -1) {
                        scope.user.account.roles[index] = scope.selectedRole;
                        scope.currentRole = scope.selectedRole;
                    }

                });


                scope.removeRole = function() {
                    scope.user.account.roles = _(scope.user.account.roles).filter(function (r) {
                        return r.id != scope.selectedRole.id
                    });
                }
            }
        }
    });