angular.module('private.admin.users.edit.directives', ['wegas.directive.permission.edit'])
    .directive('adminUsersEditIndex', function() {
        "use strict";
        return {
            scope:{
                close:"&"
            },
            templateUrl: 'app/private/admin/users/edit/directives.tmpl/index.html',
            controller: "AdminUsersEditIndexController as adminUsersEditIndexCtrl"
        };
    }).controller("AdminUsersEditIndexController", function AdminUsersEditIndexController(UsersModel, $stateParams, $state, $scope, $rootScope){
        "use strict";
        var ctrl = this;
        ctrl.user = { isNonLocal: false };
        UsersModel.getFullUser($stateParams.id).then(function(response) {
            if (!response.isErroneous()) {
                ctrl.user = response.data;
                ctrl.currentEmail = ctrl.user.account.email;
                ctrl.user.isNonLocal = (ctrl.user.account["@class"] === "AaiAccount");
            }else{
                $state.go("^");
            }
        });

        ctrl.removePermission = function(permission) {
           ctrl.user.account.permissions = _.without(ctrl.user.account.permissions, permission);
        };

        ctrl.addPermission = function() {
            var newPermission = {'id':null, "@class":"Permission","value":""};
            ctrl.user.account.permissions.push(newPermission);
        };

        ctrl.save = function () {
            UsersModel.updateUser(ctrl.currentEmail, ctrl.user.account, /* relaxed checking: */ true).then(function (response) {
                if (response && response.isErroneous()) {
                    response.flash();
                }
                if (!response || !response.isErroneous()) {
                    // Brutal way of reloading the updated user from the server, until UsersModel offers finer mechanisms:
                    UsersModel.clearCache();
                    $rootScope.$emit("changeUsers", true);
                    $scope.close();
                }
            });
        };
    })
    .directive('adminUsersEditGroups', function(GroupsModel) {
        "use strict";
        return {
            templateUrl: "app/private/admin/users/edit/directives.tmpl/groups.html",
            scope: {
                user: '='
            },
            link: function(scope, element, attrs) {
                GroupsModel.getGroups().then(function(response) {
                    if (!response.isErroneous()) {
                        scope.groups = response.data;
                    } else {
                        response.flash();
                    }
                });

                // Add a new role to the user, proposing Trainer as the default option
                scope.addGroup = function() {
                    var trainerGroup = scope.groups.filter(function(item) {
                        return item.name === 'Trainer';
                    });
                    // Fall back to admin group if no trainer group was found:
                    var newGroup = angular.copy(trainerGroup[0] || scope.groups[0]);
                    scope.user.roles.push(newGroup);
                    scope.user.account.roles.push(newGroup);
                };
            }
        };
    })
    .directive('adminUsersEditGroup', function(GroupsModel) {
        "use strict";
        return {
            templateUrl: "app/private/admin/users/edit/directives.tmpl/group.html",
            scope: {
                currentGroup: '=',
                user: '='
            },
            link: function(scope, element, attrs, parentCtrl) {
                GroupsModel.getGroups().then(function(response) {
                    if (!response.isErroneous()) {
                        scope.groups = response.data;
                    } else {
                        response.flash();
                    }
                });

                scope.selectedGroup = scope.currentGroup;
                // Scroll new role into view:
                $('.modal .modal__content').scrollTop(9999);

                // Updating user groups when user select another role in the list
                scope.$watch('selectedGroup', function() {
                    var index = scope.user.account.roles.indexOf(scope.currentGroup);
                    if (index > -1) {
                        scope.user.account.roles[index] = scope.selectedGroup;
                        scope.currentGroup = scope.selectedGroup;
                    }
                });

                scope.removeGroup = function() {
                    scope.user.account.roles = _(scope.user.account.roles).filter(function (r) {
                        return r.id !== scope.selectedGroup.id;
                    }).value();
                };
            }
        };
    });
