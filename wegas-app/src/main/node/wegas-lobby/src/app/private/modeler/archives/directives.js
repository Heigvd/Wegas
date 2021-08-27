angular.module('private.modeler.archives.directives', [])
    .directive('modelerModelsArchivesIndex', function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/modeler/archives/directives.tmpl/index.html',
            controller: "ModelerArchivesIndexController as modelerArchivesIndexCtrl"
        };
    })
    .controller("ModelerArchivesIndexController", function ModelerArchivesIndexController($rootScope, $scope, $translate, ScenariosModel, Flash, $filter, Auth, UsersModel) {
        "use strict";
        var ctrl = this;
        ctrl.rawArchives = [];
        ctrl.archives = [];
        ctrl.search = "";
        ctrl.loading = true;
        ctrl.username = '';


        /*
         ** Filters ctrl.rawArchives according to the given search string and puts the result in ctrl.archives.
         ** Hypothesis: input array ctrl.rawArchives is already ordered according to the 'createdTime' attribute,
         ** so that the output automatically follows the same ordering.
         */
        ctrl.filterArchives = function(search) {
            if (!search || search.length === 0) {
                ctrl.archives = ctrl.rawArchives;
                if (!$rootScope.$$phase) {
                    $scope.$apply();
                }
                return;
            }
            var res = [],
                len = ctrl.rawArchives.length,
                i;
            for (i = 0; i < len; i++) {
                var model = ctrl.rawArchives[i];
                if (model.canView === false || model.canEdit === false)
                    continue;
                var needle = search.toLowerCase();
                if ((model.name && model.name.toLowerCase().indexOf(needle) >= 0) ||
                    (model.createdByName && model.createdByName.toLowerCase().indexOf(needle) >= 0) ||
                    (model.comments && model.comments.toLowerCase().indexOf(needle) >= 0) ||
                    // If searching for a number, the id has to start with the given pattern:
                    model.id.toString().indexOf(needle) === 0) {
                    res.push(model);
                }
            }
            ctrl.archives = res;
            if (!$rootScope.$$phase) {
                $scope.$apply();
            }
        };

        // Use jQuery input events, more reliable than Angular's:
        $(document).off("input", '#searchFieldModelArchives'); // Detach any previous input handler
        $(document).on("input", '#searchFieldSModelArchives', function() {
            // At this point, the search variable is not necessarily updated by Angular to reflect the real input field:
            ctrl.search = this.value;
            ctrl.filterArchives(ctrl.search);
        });

        ctrl.updateModels = function() {
            ctrl.loading = true;
            ScenariosModel.getModels("BIN").then(function(response) {
                ctrl.loading = false;
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    ctrl.rawArchives = $filter('orderBy')(response.data, 'createdTime', true) || [];
                    // At this point, the search variable is not yet updated by Angular to reflect the input field:
                    var searchField = document.getElementById('searchFieldArchives');
                    if (searchField) {
                        ctrl.search = searchField.getElementsByClassName('tool__input')[0].value;
                    }
                    ctrl.filterArchives(ctrl.search);
                }
                if (ctrl.rawArchives.length === 0) {
                    $scope.close();
                }
            });
        };

        ctrl.unarchiveModel = function(modelToUnarchive) {
            if (modelToUnarchive) {
                ScenariosModel.unarchiveScenario(modelToUnarchive).then(function(response) {
                    if (!response.isErroneous()) {
                        $rootScope.$emit('entrenchNbArchives', 1);
                        ctrl.updateModels();
                        // The model is reinserted into the LIVE list, which has to be updated:
                        $rootScope.$emit('changeModels', true);
                    } else {
                        response.flash();
                    }
                });
            } else {
                $translate('COMMONS-SCENARIOS-NO-SCENARIO-FLASH-ERROR').then(function(message) {
                    Flash.danger(message);
                });
            }
        };

        ctrl.deleteArchivedModel = function(modelToDelete) {
            if (modelToDelete) {
                ScenariosModel.deleteArchivedScenario(modelToDelete).then(function(response) {
                    if (!response.isErroneous()) {
                        $rootScope.$emit('entrenchNbArchives', 1);
                        ctrl.updateModels();
                        //$rootScope.$emit('changeModels', true);
                    } else {
                        response.flash();
                    }
                });
            } else {
                $translate('COMMONS-SCENARIOS-NO-SCENARIO-FLASH-ERROR').then(function(message) {
                    Flash.danger(message);
                });
            }
        };

        /* Listen for new models */
        $rootScope.$on('changeModels', function(e, hasNewData) {
            if (hasNewData) {
                ctrl.updateModels();
            }
        });

        // Find out what the current user's "friendly" username is.
        Auth.getAuthenticatedUser().then(function(user) {
            if (user !== false) {
                UsersModel.getFullUser(user.id).then(function(response) {
                    if (response.isErroneous()) {
                        response.flash();
                    } else {
                        ctrl.username = response.data.name;
                    }
                })
            }
        });

        ctrl.updateModels();
    })
    .directive('modelerModelsArchivesList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/archives/directives.tmpl/list.html',
            scope: {
                models: "=",
                unarchive: "=",
                delete: "=",
                search: "=",
                loading: "=",
                username: "="
            }
        };
    });
