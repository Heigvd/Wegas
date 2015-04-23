angular.module('private.admin.groups.directives', [])
    .directive('adminGroupsIndex', function() {
        return {
            templateUrl: 'app/private/admin/groups/directives.tmpl/index.html',
            controller: "AdminGroupsIndexController as AdminGroupsIndexCtrl"
        };
    })
    .controller("AdminGroupsIndexController", function AdminGroupsIndexController($rootScope, Flash) {
        var ctrl = this;
        // TODO
    })
    .directive('adminGroupsList', function(Flash) {
        return {
            templateUrl: 'app/private/admin/groups/directives.tmpl/list.html',
            scope: false,
            require: "^adminGroupsIndex",
            link: function(scope, element, attrs, parentCtrl) {
                // TODO
            }
        };
    })