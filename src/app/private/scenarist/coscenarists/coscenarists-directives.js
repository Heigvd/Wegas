angular
.module('private.scenarist.coscenarists.directives', [
    "wegas.directives.search.users"
])
.directive('scenaristCoscenaristsIndex', function(ScenariosModel){
  return {
    templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists-index.html',
    controller : function($scope, $stateParams, $sce) {
        var ctrl = this;
        $scope.scenarios = [];
        $scope.scenario = {};

        ctrl.updateScenario = function() {
                // Searching for current scenario
                ScenariosModel.getScenario($stateParams.scenarioId).then(function(response) {
                    if (response.isErroneous()) {
                        response.flash();
                    } else {
                        $scope.scenario = response.data;

                        // Loading permissions
                        ScenariosModel.getPermissions($stateParams.scenarioId).then(function(response) {
                            if (response.isErroneous()) {
                                response.flash();
                            } else {
                                $scope.permissions = response.data;
                            }
                        });
                    }

                });
        };

        ctrl.updateScenario();
    }
};
})
.directive('scenaristCoscenaristsAdd', function(ScenariosModel, UsersModel) {
    return {
        templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists-add.html',
        scope: {
            scenario: '='
        },
        require: "^scenaristCoscenaristsIndex",
        link : function(scope, element, attrs, parentCtrl) {

            scope.restrictRoles = ["Administrator", "Scenarist"];

            scope.callbackSearchUser = function(selection) {
                scope.selected_user = selection;
                scope.addNewCoscenarist();
            }

            scope.addNewCoscenarist = function() {
                if (scope.selected_user.id) {
                    ScenariosModel.updatePermissions(scope.$parent.scenario.id,
                        scope.selected_user.id, true,false,false).then(function (response) {
                            if (response.isErroneous()) {
                                response.flash();
                            } else {
                                parentCtrl.updateScenario();
                            }
                    });
                }
            };
        }
    };
})
.directive('scenaristCoscenaristsList', function(ScenariosModel) {
    return {
        templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists-list.html',
        scope: false,
        require: "^scenaristCoscenaristsIndex",
        link : function(scope, element, attrs, parentCtrl) {
            scope.$watch(function() {
                return parentCtrl.permissions
            }, function(newPermissions, permissions) {
                scope.permissions = newPermissions;
            });

            scope.removeUser = function (scenarioId, userId) {
                ScenariosModel.deletePermissions(scenarioId, userId).then(function(response) {
                    if (response.isErroneous()) {
                        response.flash();
                    } else {
                        var index = _.findIndex(scope.permissions, function (p) {
                            return p.user.id == userId;
                        });
                        if (index > -1) {
                            scope.permissions.splice(index,1);
                        }
                    }
                });
            }

        },
    };
})

.directive('scenaristCoscenaristsUserPermissions', function(ScenariosModel) {
    return {
        templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists-user-permissions.html',
        scope: false,
        require: "^scenaristCoscenaristsIndex",
        link : function(scope, element, attrs, parentCtrl) {

            function calculatePermissions() {
                scope.canEdit = _.contains(scope.permission.permissions, "Duplicate") &&
                _.contains(scope.permission.permissions, "Instantiate") &&
                _.contains(scope.permission.permissions, "View") &&
                _.contains(scope.permission.permissions, "Edit") &&
                _.contains(scope.permission.permissions, "Delete");

                scope.canDuplicate = _.contains(scope.permission.permissions, "Duplicate");
                scope.canCreate = _.contains(scope.permission.permissions, "Instantiate");
            }
            calculatePermissions();


            scope.updatePermissions = function() {

                ScenariosModel.updatePermissions(this.scenario.id, this.permission.user.id, this.canCreate, this.canDuplicate, this.canEdit).then(function (response) {
                    if (response.isErroneous()) {
                        response.flash();
                        calculatePermissions();
                    }
                });
            };

        }
    };
});