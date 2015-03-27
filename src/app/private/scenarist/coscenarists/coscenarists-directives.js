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

        ctrl.updateScenario = function() {
            ScenariosModel.getScenarios().then(function(scenarios) {
                $scope.scenarios = scenarios;
                // Searching for current scenario
                ScenariosModel.getScenario($stateParams.scenarioId).then(function(scenario) {
                    $scope.scenario = scenario;

                    // Loading permissions
                    ScenariosModel.getPermissions($stateParams.scenarioId).then(function(permissions) {
                        $scope.permissions = permissions;
                    });
                });

            });
        };

        ctrl.updateScenario();
    }
};
})
.directive('scenaristCoscenaristsAdd', function(ScenariosModel, UsersModel) {
    return {
        templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists-add.html',
        scope: false,
        require: "^scenaristCoscenaristsIndex",
        link : function(scope, element, attrs, parentCtrl) {

            scope.$watch(function() {
                return parentCtrl.scenario
            } , function(n,o) {
                scope.scenario = n;
            });

            scope.callbackSearchUser = function(selection) {
                scope.selected_user = selection;
                scope.addNewCoscenarist();
            }

            scope.addNewCoscenarist = function() {
                if (scope.selected_user.id) {
                    ScenariosModel.updatePermissions(parentCtrl.scenario.id,
                        scope.selected_user.id, true,false,false).then(function (result) {
                            parentCtrl.updateScenario();
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
                ScenariosModel.deletePermissions(scenarioId, userId).then(function(result) {
                    if (result === true) {
                        var index = scope.permissions.indexOf(this.permission);
                        scope.permissions.splice(index,1);
                    } else {
                        alert(result.message);
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

            scope.canEdit = _.contains(scope.permission.permissions, "Duplicate") &&
            _.contains(scope.permission.permissions, "Instantiate") &&
            _.contains(scope.permission.permissions, "View") &&
            _.contains(scope.permission.permissions, "Edit") &&
            _.contains(scope.permission.permissions, "Delete");

            scope.canDuplicate = _.contains(scope.permission.permissions, "Duplicate");
            scope.canCreate = _.contains(scope.permission.permissions, "Instantiate");


            scope.updatePermissions = function() {

                ScenariosModel.updatePermissions(this.scenario.id, this.permission.user.id, this.canCreate, this.canDuplicate, this.canEdit).then(function (result) {
                    if (result === true) {
                        // Needs to do something ?
                    }
                });
            };

        }
    };
});