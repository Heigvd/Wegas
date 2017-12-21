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
                "value": ""
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
    })
    .directive("adminGroupsMembersIndex", function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: "app/private/admin/groups/edit/directives.tmpl/members.html",
            controller: "AdminGroupsEditMemberIndexController as adminGroupsMemberIndexCtrl"
        };
    })
    .controller("AdminGroupsEditMemberIndexController", function($state, $stateParams, GroupsModel) {
        "use strict";
        this.users = [];
        GroupsModel.getGroup($stateParams.id).then(function(response) {
            if (!response.isErroneous()) {
                this.group = response.data;
            } else {
                $state.go("^");
            }
        }.bind(this));
        GroupsModel.getMembers($stateParams.id).then(function(data) {
            this.users = data;
        }.bind(this));
    });
