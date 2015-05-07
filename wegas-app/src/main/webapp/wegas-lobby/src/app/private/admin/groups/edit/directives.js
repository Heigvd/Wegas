angular.module('private.admin.groups.edit.directives', [])
    .directive('adminGroupsEditIndex', function() {
        return {
            scope:{
                close:"&"
            },
            templateUrl: 'app/private/admin/groups/edit/directives.tmpl/index.html',
            controller: "AdminGroupsEditIndexController as adminGroupsEditIndexCtrl"
        };
    }).controller("AdminGroupsEditIndexController", function AdminUsersEditIndexController(GroupsModel, $stateParams, $state){
        var ctrl = this; 
        ctrl.group = {};
        GroupsModel.getGroup($stateParams.id).then(function(response) {
            if (!response.isErroneous()) {
                ctrl.group = response.data;
            }else{
                $state.go("^");
            }
        });

        ctrl.removePermission = function(permission) {
            ctrl.group.permissions = _.without(ctrl.group.permissions, permission);
        }

        ctrl.addPermission = function() {
        	var newPermission = {'id':null, "@class":"Permission","value":"", "inducedPermission":""}
            ctrl.group.permissions.push(newPermission);
        }

        ctrl.save = function () {
          	GroupsModel.updateGroup(ctrl.group).then(function (response) {
                if (!response.isErroneous()) {
                    response.flash();
                }
            });
        }
    })
    ;