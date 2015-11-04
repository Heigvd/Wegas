angular.module('private.admin.groups.edit.directives', ['wegas.directive.permission.edit'])
    .directive('adminGroupsEditIndex', function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/admin/groups/edit/directives.tmpl/index.html',
            controller: "AdminGroupsEditIndexController as adminGroupsEditIndexCtrl"
        };
    }).controller("AdminGroupsEditIndexController",
    function AdminUsersEditIndexController(GroupsModel, $stateParams, $state) {
        "use strict";
        var ctrl = this;
        ctrl.group = {};
        GroupsModel.getGroup($stateParams.id).then(function(response) {
            if (!response.isErroneous()) {
                ctrl.group = response.data;
            } else {
                $state.go("^");
            }
        });

        ctrl.removePermission = function(permission) {
            ctrl.group.permissions = _.without(ctrl.group.permissions, permission);
        };

        ctrl.addPermission = function() {
            var newPermission = {
                'id': null,
                "@class": "Permission",
                "value": "",
                "inducedPermission": ""
            };
            ctrl.group.permissions.push(newPermission);
        };

        ctrl.save = function() {
            _.remove(ctrl.group.permissions, function(elem) {
                return !elem.value;
            });
            GroupsModel.updateGroup(ctrl.group).then(function(response) {
                if (!response.isErroneous()) {
                    response.flash();
                }
            });
        };
    });
