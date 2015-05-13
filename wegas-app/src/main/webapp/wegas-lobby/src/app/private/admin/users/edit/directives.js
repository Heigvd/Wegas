angular.module('private.admin.users.edit.directives', [])
    .directive('adminUsersEditIndex', function() {
        return {
            scope:{
                close:"&"
            },
            templateUrl: 'app/private/admin/users/edit/directives.tmpl/index.html',
            controller: "AdminUsersEditIndexController as adminUsersEditIndexCtrl"
        };
    }).controller("AdminUsersEditIndexController", function AdminUsersEditIndexController(UsersModel, $stateParams, $state){
        var ctrl = this; 
        ctrl.user = {};
        UsersModel.getFullUser($stateParams.id).then(function(response) {
            if (!response.isErroneous()) {
                ctrl.user = response.data;
            }else{
                $state.go("^");
            }
        });

        ctrl.removePermission = function(permission) {
           ctrl.user.account.permissions = _.without(ctrl.user.account.permissions, permission);
        }

        ctrl.addPermission = function() {
            var newPermission = {'id':null, "@class":"Permission","value":"", "inducedPermission":""}
            ctrl.user.account.permissions.push(newPermission);
        }
        
        ctrl.save = function () {
            UsersModel.updateUser(ctrl.user.account).then(function (response) {
                if (!response.isErroneous()) {
                    response.flash();
                }
            });
        }
    })
    .directive('adminUsersEditGroups', function(GroupsModel) {
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

                // Create a new
                scope.addGroup = function() {
                    var new_group = angular.copy(scope.groups[0])
                    scope.user.account.roles.push(new_group);
                }
            }
        }
    })
    .directive('adminUsersEditGroup', function(GroupsModel) {
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
                        return r.id != scope.selectedGroup.id
                    });
                }
            }
        }
    });