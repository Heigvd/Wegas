angular.module('private.scenarist.archives.directives', [])
    .directive('scenaristScenariosArchivesIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/scenarist/archives/directives.tmpl/index.html',
            controller: "ScenaristArchivesIndexController as scenaristArchivesIndexCtrl"
        };
    }).controller("ScenaristArchivesIndexController", function ScenaristArchivesIndexController($rootScope, $scope, ScenariosModel, Flash) {
        var ctrl = this;
        ctrl.archives = [];
        ctrl.sfilter = {
            init: false,
            search : ""
        };
        $scope.$watch(function(){
            return ctrl.sfilter.search;
        }, function(newSearch){
            if(ctrl.sfilter.init){
                $rootScope.$emit("changeSearch", newSearch);
            }else{
                ctrl.sfilter.search = $rootScope.search;
                ctrl.sfilter.init = true;
            }
        });

        ctrl.updateScenarios = function() {
        	ScenariosModel.getScenarios("BIN").then(function(response) {
                ctrl.archives = response.data || [];
                if (ctrl.archives.length == 0) {
                    $scope.close();
                }
            });
        };

        ctrl.unarchiveScenario = function(scenarioToUnarchive) {
            if (scenarioToUnarchive) {
                ScenariosModel.unarchiveScenario(scenarioToUnarchive).then(function(response) {
                    if (!response.isErroneous()) {
                        $rootScope.$emit('changeScenarios', true);
                    }else{
                        response.flash();
                    }
                });
            } else {
                Flash.danger("No scenario choosed");
            }
        };

        ctrl.deleteArchivedScenario = function(scenarioToDelete) {
            if (scenarioToDelete) {
                ScenariosModel.deleteArchivedScenario(scenarioToDelete).then(function(response) {
                    if (!response.isErroneous()) {
                        $rootScope.$emit('changeScenarios', true);
                    }else{
                        response.flash();
                    }
                });
            } else {
                Flash.danger("No scenario choosed");
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
        return {
            scope: {
                scenarios: "=",
                unarchive: "=",
                delete:"=",
                search:"="
            },
            templateUrl: 'app/private/scenarist/archives/directives.tmpl/list.html',
            link:function(scope, elem, attrs){
                scope.MAX_DISPLAYED_CHARS = MAX_DISPLAYED_CHARS;
            }
        };
    });