angular.module('private.admin.who', ['wegas.service.pusher'])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.admin.who', {
                url: '/who',
                views: {
                    'admin-container': {
                        controller: 'AdminWhoCtrl as adminWhoCtrl',
                        templateUrl: 'app/private/admin/who/who.tmpl.html'
                    }
                }
            });
    })

    .controller('AdminWhoCtrl', function AdminWhoCtrl($state, $scope, $rootScope, Auth, WegasPusher) {
        "use strict";
        var ctrl = this;
        ctrl.who = [];
        ctrl.loading = true;

        ctrl.updateWhoList = function() {
            ctrl.who = WegasPusher.getMembers();
            ctrl.loading = false;
            if ( ! $rootScope.$$phase) {
                $scope.$apply();
            }
        };

        $rootScope.$on('update-members', function(e) {
                ctrl.updateWhoList();
        });

        ctrl.updateWhoList();
    });
