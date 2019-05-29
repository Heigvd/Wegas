angular
    .module('private.scenarist.coscenarists.directives', [
        "wegas.directives.search.users"
    ])
    .directive('scenaristCoscenaristsIndex', function(ScenariosModel, PermissionsModel) {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/coscenarists/directives.tmpl/index.html',
            scope: {
                close: "&"
            },
            controller: function($scope, $stateParams, $sce) {
                var ctrl = this;
                ctrl.scenario = {};
                ctrl.permissions = [];

                ctrl.coscenarists = function() {
                    var result = [];
                    for (var i = 0; i < ctrl.permissions.length; i++) {
                        result.push(ctrl.permissions[i].user);
                    }
                    return result;
                };

                ctrl.updateScenario = function() {
                    // Searching for current scenario
                    ScenariosModel.getScenario("LIVE", $stateParams.scenarioId).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                        } else {
                            ctrl.scenario = response.data;
                            // Loading permissions
                            PermissionsModel.getScenarioPermissions($stateParams.scenarioId).then(function(response) {
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
    .directive('scenaristCoscenaristsAdd', function(PermissionsModel) {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/coscenarists/directives.tmpl/add.html',
            scope: {
                scenario: '='
            },
            require: "^scenaristCoscenaristsIndex",
            link: function(scope, element, attrs, parentCtrl) {

                scope.restrictRoles = ["Administrator", "Scenarist", "Trainer"];

                scope.exclude = parentCtrl.coscenarists;

                scope.callbackSearchUser = function(selection) {
                    scope.selected_user = selection;
                    scope.addNewCoscenarist();
                };

                scope.addNewCoscenarist = function() {
                    if (scope.selected_user.id) {
                        PermissionsModel.updateScenarioPermissions(scope.scenario.id,
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
    .directive('scenaristCoscenaristsList', function(PermissionsModel) {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/coscenarists/directives.tmpl/list.html',
            scope: {
                permissions: "=",
                scenario: "="
            },
            link: function(scope, element, attrs) {
                scope.removeUser = function(scenarioId, userId) {
                    PermissionsModel.deleteScenarioPermissions(scenarioId, userId).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                        } else {
                            var index = _.findIndex(scope.permissions, function(p) {
                                return +p.user.id === +userId;
                            });
                            if (index > -1) {
                                scope.permissions.splice(index, 1);
                            }
                        }
                    });
                };
            },
        };
    })
    .directive('scenaristCoscenaristsUserPermissions', function(PermissionsModel) {
        "use strict";
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

                    scope.canTranslate = {};

                    if (scope.canEdit) {
                        scope.languages.forEach(function(lang) {
                            scope.canTranslate[lang] = true;
                        });
                    } else {
                        scope.userPermissions.permissions.forEach(function(p) {
                            if (p.indexOf("Translate-") === 0) {
                                scope.canTranslate[p.substring(10)] = true;
                            }
                        });
                    }
                }

                scope.languages = scope.scenario.languages.map(function(language) {
                    return language.code;
                });
                scope.nbColumns = Math.ceil(scope.languages.length / 3) + 1;

                calculatePermissions();

                scope.updatePermissions = function() {
                    if (scope.canEdit) {
                        scope.canDuplicate = true;
                        scope.canCreate = true;

                        scope.languages.forEach(function(lang) {
                            scope.canTranslate[lang] = true;
                        })
                    }

                    PermissionsModel.updateScenarioPermissions(this.scenario.id, this.userPermissions.user.id, this.canCreate, this.canDuplicate, this.canEdit, this.canTranslate).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                            calculatePermissions();
                        }
                    });
                };

            }
        };
    });
