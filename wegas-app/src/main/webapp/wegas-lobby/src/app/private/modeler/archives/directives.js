angular.module('private.modeler.archives.directives', [])
    .directive('modelerScenariosArchivesIndex', function() {
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
                var scenario = ctrl.rawArchives[i];
                if (scenario.canView === false || scenario.canEdit === false)
                    continue;
                var needle = search.toLowerCase();
                if ((scenario.name && scenario.name.toLowerCase().indexOf(needle) >= 0) ||
                    (scenario.createdByName && scenario.createdByName.toLowerCase().indexOf(needle) >= 0) ||
                    (scenario.comments && scenario.comments.toLowerCase().indexOf(needle) >= 0) ||
                    // If searching for a number, the id has to start with the given pattern:
                    scenario.id.toString().indexOf(needle) === 0) {
                    res.push(scenario);
                }
            }
            ctrl.archives = res;
            if (!$rootScope.$$phase) {
                $scope.$apply();
            }
        };

        // Use jQuery input events, more reliable than Angular's:
        $(document).off("input", '#searchFieldScenarioArchives'); // Detach any previous input handler
        $(document).on("input", '#searchFieldScenarioArchives', function() {
            // At this point, the search variable is not necessarily updated by Angular to reflect the real input field:
            ctrl.search = this.value;
            ctrl.filterArchives(ctrl.search);
        });

        ctrl.updateScenarios = function() {
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

        ctrl.unarchiveScenario = function(scenarioToUnarchive) {
            if (scenarioToUnarchive) {
                ScenariosModel.unarchiveScenario(scenarioToUnarchive).then(function(response) {
                    if (!response.isErroneous()) {
                        $rootScope.$emit('entrenchNbArchives', 1);
                        ctrl.updateScenarios();
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

        ctrl.deleteArchivedScenario = function(scenarioToDelete) {
            if (scenarioToDelete) {
                ScenariosModel.deleteArchivedScenario(scenarioToDelete).then(function(response) {
                    if (!response.isErroneous()) {
                        $rootScope.$emit('entrenchNbArchives', 1);
                        ctrl.updateScenarios();
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

        /* Listen for new scenarios */
        $rootScope.$on('changeModels', function(e, hasNewData) {
            if (hasNewData) {
                ctrl.updateScenarios();
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

        ctrl.updateScenarios();
    })
    .directive('modelerScenariosArchivesList', function() {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/archives/directives.tmpl/list.html',
            scope: {
                scenarios: "=",
                unarchive: "=",
                delete: "=",
                search: "=",
                loading: "=",
                username: "="
            }
        };
    });
