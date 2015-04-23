angular.module('private.admin.users.directives', [])
    .directive('adminUsersIndex', function() {
        return {
            templateUrl: 'app/private/admin/users/directives.tmpl/index.html',
            controller: "AdminUsersIndexController as AdminUsersIndexCtrl"
        };
    })
    .controller("AdminUsersIndexController", function AdminUsersIndexController($rootScope, Flash) {
        var ctrl = this;
        // TODO
    })
    .directive('adminUsersList', function(ScenariosModel, SessionsModel, Flash) {
        return {
            templateUrl: 'app/private/admin/users/directives.tmpl/list.html',
            scope: false,
            // require: "^adminUsersIndex",
            link: function(scope, element, attrs, parentCtrl) {
                // TODO
            }
        };
    })