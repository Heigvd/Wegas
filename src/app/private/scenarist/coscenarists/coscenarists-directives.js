angular
.module('private.scenarist.coscenarists.directives', [])
.directive('scenaristCoscenaristsIndex', function(ScenariosModel){
  return {
    templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists-index.html',
    controller : function($scope, $stateParams) {
        var ctrl = this,
        scenarios = [],
        scenario = null,
        permissions = null;


        ctrl.updateScenario = function() {
            ScenariosModel.getScenarios().then(function(scenarios) {
                ctrl.scenarios = scenarios;
                // Searching for current scenario
                ScenariosModel.getScenario($stateParams.scenarioId).then(function(scenario) {
                    ctrl.scenario = scenario;

                    // Loading permissions
                    ScenariosModel.getPermissions($stateParams.scenarioId).then(function(permissions) {
                        ctrl.permissions = permissions;
                    });
                });

            });
        };

        ctrl.updateScenario();


        $scope.$on('permissions-changed', function () {
            // Save the new permissions
            // alert('asd');
            console.info('I should update');
        });

    }
};
})

.directive('scenaristCoscenaristsAdd', function(ScenariosModel) {
  return {
    templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists-add.tmpl.html',
    scope: false,
    require: "^scenaristCoscenaristsIndex",
    link : function(scope, element, attrs, parentCtrl) {
        scope.username = "";

        scope.$watch(function() {
            return parentCtrl.scenario
        } , function(n,o) {
            scope.scenario = n;
        });

        scope.addNewCoscenarist = function() {
            // TODO
            alert('Sorry... Not yet implemented...');
        };
    }
};
})

.directive('scenaristCoscenaristsList', function(ScenariosModel) {
    return {
        templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists-list.tmpl.html',
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
        templateUrl: 'app/private/scenarist/coscenarists/tmpl/coscenarists-user-permissions.tmpl.html',
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
                        parentCtrl.updateScenario();
                    }
                });
            };

        }
    };
});