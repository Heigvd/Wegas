angular
    .module('private.scenarist.coscenarists.directives', [
        "wegas.directives.search.users"
    ])
    .directive('scenaristCoscenaristsIndex', function(ScenariosModel) {
        return {
            templateUrl: 'app/private/scenarist/coscenarists/directives.tmpl/index.html',
            scope: {
                close: "&"
            },
            controller: function($scope, $stateParams, $sce) {
                var ctrl = this;
                ctrl.scenario = {};
                ctrl.permissions =[];

                ctrl.updateScenario = function() {
                    // Searching for current scenario
                    ScenariosModel.getScenario("LIVE", $stateParams.scenarioId).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                        } else {
                            ctrl.scenario = response.data;

                            // Loading permissions
                            ScenariosModel.getPermissions($stateParams.scenarioId).then(function(response) {
                                if (response.isErroneous()) {
                                    response.flash();
                                } else {
                                    ctrl.permissions = response.data;
                                }
                            });
                        }

                    });
                };
                ctrl.updateScenario();
                $scope.scenaristCoscenaristsIndexCtrl = this;
            }
        };
    })
    .directive('scenaristCoscenaristsAdd', function(ScenariosModel, UsersModel) {
        return {
            templateUrl: 'app/private/scenarist/coscenarists/directives.tmpl/add.html',
            scope: {
                scenario: '='
            },
            require: "^scenaristCoscenaristsIndex",
            link: function(scope, element, attrs, parentCtrl) {

                scope.restrictRoles = ["Administrator", "Scenarist", "Trainer"];

                scope.callbackSearchUser = function(selection) {
                    scope.selected_user = selection;
                    scope.addNewCoscenarist();
                }

                scope.addNewCoscenarist = function() {
                    if (scope.selected_user.id) {
                        ScenariosModel.updatePermissions(scope.scenario.id,
                            scope.selected_user.id, true, false, false).then(function(response) {
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
            templateUrl: 'app/private/scenarist/coscenarists/directives.tmpl/list.html',
            scope: {
                permissions:"=",
                scenario: "="
            },
            link: function(scope, element, attrs) {
                scope.removeUser = function(scenarioId, userId) {
                    ScenariosModel.deletePermissions(scenarioId, userId).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                        } else {
                            var index = _.findIndex(scope.permissions, function(p) {
                                return p.user.id == userId;
                            });
                            if (index > -1) {
                                scope.permissions.splice(index, 1);
                            }
                        }
                    });
                }

            },
        };
    })

.directive('scenaristCoscenaristsUserPermissions', function(ScenariosModel) {
    return {
        templateUrl: 'app/private/scenarist/coscenarists/directives.tmpl/user-permissions.html',
        scope: {
            userPermissions: "=",
            scenario: "="
        },
        require: "^scenaristCoscenaristsIndex",
        link: function(scope, element, attrs, parentCtrl) {

            function calculatePermissions() {
                scope.canEdit = _.contains(scope.userPermissions.permissions, "Duplicate") &&
                    _.contains(scope.userPermissions.permissions, "Instantiate") &&
                    _.contains(scope.userPermissions.permissions, "View") &&
                    _.contains(scope.userPermissions.permissions, "Edit") &&
                    _.contains(scope.userPermissions.permissions, "Delete");

                scope.canDuplicate = _.contains(scope.userPermissions.permissions, "Duplicate");
                scope.canCreate = _.contains(scope.userPermissions.permissions, "Instantiate");


            }
            calculatePermissions();

            scope.updatePermissions = function() {
                if(scope.canEdit){
                    scope.canDuplicate = true;
                    scope.canCreate = true;
                }

                ScenariosModel.updatePermissions(this.scenario.id, this.userPermissions.user.id, this.canCreate, this.canDuplicate, this.canEdit).then(function(response) {
                    if (response.isErroneous()) {
                        response.flash();
                        calculatePermissions();
                    }
                });
            };

        }
    };
});