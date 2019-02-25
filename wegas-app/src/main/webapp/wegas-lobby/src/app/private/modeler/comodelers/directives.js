angular
    .module('private.modeler.comodelers.directives', [
        "wegas.directives.search.users"
    ])
    .directive('modelerComodelersIndex', function(ScenariosModel, PermissionsModel) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/comodelers/directives.tmpl/index.html',
            scope: {
                close: "&"
            },
            controller: function($scope, $stateParams, $sce) {
                var ctrl = this;
                ctrl.model = {};
                ctrl.permissions = [];

                ctrl.comodelers = function() {
                    var result = [];
                    for (var i=0; i<ctrl.permissions.length; i++){
                        result.push(ctrl.permissions[i].user);
                    }
                    return result;
                };

                ctrl.updateModel = function() {
                    // Searching for current model
                    ScenariosModel.getModel("LIVE", $stateParams.modelId).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                        } else {
                            ctrl.model = response.data;
                            // Loading permissions
                            PermissionsModel.getScenarioPermissions($stateParams.modelId).then(function(response) {
                                if (response.isErroneous()) {
                                    response.flash();
                                } else {
                                    ctrl.permissions = response.data;
                                }
                            });
                        }

                    });
                };
                ctrl.updateModel();
                $scope.modelerComodelersIndexCtrl = this;
            }
        };
    })
    .directive('modelerComodelersAdd', function(PermissionsModel) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/comodelers/directives.tmpl/add.html',
            scope: {
                model: '='
            },
            require: "^modelerComodelersIndex",
            link: function(scope, element, attrs, parentCtrl) {

                scope.restrictRoles = ["Administrator", "Modeler", "Scenarist"];

                scope.exclude = parentCtrl.comodelers;

                scope.callbackSearchUser = function(selection) {
                    scope.selected_user = selection;
                    scope.addNewComodeler();
                };

                scope.addNewComodeler = function() {
                    if (scope.selected_user.id) {
                        PermissionsModel.updateScenarioPermissions(scope.model.id,
                            scope.selected_user.id, true, false, false).then(function(response) {
                            if (response.isErroneous()) {
                                response.flash();
                            } else {
                                parentCtrl.updateModel();
                            }
                        });
                    }
                };
            }
        };
    })
    .directive('modelerComodelersList', function(PermissionsModel) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/comodelers/directives.tmpl/list.html',
            scope: {
                permissions: "=",
                model: "="
            },
            link: function(scope, element, attrs) {
                scope.removeUser = function(modelId, userId) {
                    PermissionsModel.deleteScenarioPermissions(modelId, userId).then(function(response) {
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
    .directive('modelerComodelersUserPermissions', function(PermissionsModel) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/comodelers/directives.tmpl/user-permissions.html',
            scope: {
                userPermissions: "=",
                model: "="
            },
            require: "^modelerComodelersIndex",
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
                    if (scope.canEdit) {
                        scope.canDuplicate = true;
                        scope.canCreate = true;
                    }

                    PermissionsModel.updateScenarioPermissions(this.model.id, this.userPermissions.user.id, this.canCreate, this.canDuplicate, this.canEdit).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                            calculatePermissions();
                        }
                    });
                };

            }
        };
    });
