angular.module('private.admin.users', [
    'wegas.behaviours.repeat.autoload',
    'private.admin.users.edit'
])
    .config(function($stateProvider) {
        $stateProvider
            .state('wegas.private.admin.users', {
                url: '/users',
                views: {
                    'admin-container': {
                        controller: 'AdminUsersCtrl as adminUsersCtrl',
                        templateUrl: 'app/private/admin/users/users.tmpl.html'
                    }
                }
            });
    })
    .controller('AdminUsersCtrl', function AdminUsersCtrl($state, $rootScope, Auth, ViewInfos, UsersModel) {
        var ctrl = this,
        initMaxUsersDisplayed = function() {
            if (ctrl.users.length > 12) {
                ctrl.maxUsersDisplayed = 10;
            } else {
                ctrl.maxUsersDisplayed = ctrl.users.length;
            }
        };
        ctrl.maxUsersDisplayed = null;
        ctrl.users = [];
        ctrl.search = "";

        ctrl.updateDisplay = function() {
            if (ctrl.maxUsersDisplayed == null) {
                initMaxUsersDisplayed();
            }
            if (ctrl.maxUsersDisplayed >= ctrl.users.length) {
                ctrl.maxUsersDisplayed = ctrl.users.length;
            } else {
                ctrl.maxUsersDisplayed += 15;
            }

        };

        ctrl.updateUsersList = function(displayUp) {
            UsersModel.getUsers().then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    ctrl.users = response.data || [];
                    if(displayUp){
                        ctrl.updateDisplay();
                    }
                }
            });
        };

        ctrl.deleteUser = function(id) {
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
                ctrl.updateUsersList(true);
            }
        });

        ctrl.updateUsersList(true); 
    })
;