angular.module('private.admin.groups', [
    'private.admin.groups.edit'
    ])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
        .state('wegas.private.admin.groups', {
            url: '/groups',
            views: {
                'admin-container': {
                    controller: 'AdminGroupsCtrl as adminGroupsCtrl',
                    templateUrl: 'app/private/admin/groups/groups.tmpl.html'
                }
            }
        })
    ;
})
.controller('AdminGroupsCtrl', function AdminGroupsCtrl(GroupsModel) {
    "use strict";
    var ctrl = this;
    ctrl.groups = [];
    ctrl.newGroup = {
        name: ""
    };
    ctrl.updateGroups = function(){
        GroupsModel.getGroups().then(function(response){
            if(!response.isErroneous()){
                ctrl.groups = response.data;
            }else{
                response.flash();
            }
        });
    };

    ctrl.addGroup = function(){
        GroupsModel.addGroup(ctrl.newGroup.name).then(function(response){
            if(!response.isErroneous()){
                ctrl.newGroup = {
                    name: ""
                };
                ctrl.updateGroups();
            }else{
                response.flash();
            }
        });
    };
    ctrl.removeGroup = function(group){
        GroupsModel.deleteGroup(group).then(function(response){
            if(!response.isErroneous()){
                ctrl.updateGroups();
            }else{
                response.flash();
            }
        });
    };
    ctrl.updateGroups();    
});
