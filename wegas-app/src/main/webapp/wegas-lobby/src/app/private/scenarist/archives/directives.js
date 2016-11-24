angular.module('private.scenarist.archives.directives', [])
    .directive('scenaristScenariosArchivesIndex', function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/scenarist/archives/directives.tmpl/index.html',
            controller: "ScenaristArchivesIndexController as scenaristArchivesIndexCtrl"
        };
    })
    .controller("ScenaristArchivesIndexController", function ScenaristArchivesIndexController($rootScope, $scope, $translate, ScenariosModel, Flash) {
        "use strict";
        var ctrl = this;
        ctrl.archives = [];
        ctrl.search = "";
        ctrl.loading = true;

        ctrl.updateScenarios = function() {
            ctrl.loading = true;
            ScenariosModel.getScenarios("BIN").then(function(response) {
                ctrl.loading = false;
                ctrl.archives = response.data || [];
                if (ctrl.archives.length === 0) {
                    $scope.close();
                }
            });
        };

        ctrl.unarchiveScenario = function(scenarioToUnarchive) {
            if (scenarioToUnarchive) {
                ScenariosModel.unarchiveScenario(scenarioToUnarchive).then(function(response) {
                    if (!response.isErroneous()) {
                        $rootScope.$emit('entrenchNbArchives', 1);
                        $rootScope.$emit('changeLimit', true);
                        ctrl.updateScenarios();
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
                        $rootScope.$emit('changeScenarios', true);
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
        $rootScope.$on('changeScenarios', function(e, hasNewData) {
            if (hasNewData) {
                ctrl.updateScenarios();
            }
        });

        ctrl.updateScenarios();
    })
    .directive('scenaristScenariosArchivesList', function() {
        "use strict";
        return {
            scope: {
                scenarios: "=",
                unarchive: "=",
                delete: "=",
                search: "=",
                loading: "="
            },
            templateUrl: 'app/private/scenarist/archives/directives.tmpl/list.html'
        };
    });
