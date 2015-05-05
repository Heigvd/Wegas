angular
.module('private.scenarist.history.directives', [
    'ngSanitize'
])
.directive('scenaristHistoryIndex', function(ScenariosModel){
    return {

        templateUrl: 'app/private/scenarist/history/directives.tmpl/index.html',
        controller : function($scope, $stateParams, $sce, $rootScope) {
            var ctrl = this;

            $scope.scenario = {};
            $scope.scenarioId = $stateParams.scenarioId;

            ctrl.updateVersions = function () {
                ScenariosModel.getVersionsHistory($scope.scenarioId).then(function(response) {
                    if (response.isErroneous()) {
                        response.flash();
                    } else {
                        ctrl.versions = response.data;
                    }
                });
            }
            ctrl.createFork = function (name) {
                ScenariosModel.restoreVersionHistory($scope.scenarioId, name).then(function (response) {
                    response.flash();
                    if (!response.isErroneous()) {
                        $rootScope.$emit('scenarios', true);
                    }
                });
            }
            ctrl.copyScenario = function () {
                ScenariosModel.copyScenario($scope.scenarioId).then(function (response) {
                    if (!response.isErroneous()) {
                        response.flash();
                        $rootScope.$emit('scenarios', true);
                    }
                });
            };
            ctrl.addVersion = function () {
                ScenariosModel.addVersionHistory($scope.scenarioId).then(function (response) {
                    if (response.isErroneous()) {
                        response.flash();
                    } else {
                        ctrl.updateVersions();
                    }
                });
            }
            ScenariosModel.getScenario("LIVE", $scope.scenarioId).then(function (response) {
                $scope.scenario = response.data;
                ctrl.updateVersions();
            });
        }
    };
})
.directive('scenaristHistoryActions', function(ScenariosModel){
    return {
        templateUrl: 'app/private/scenarist/history/directives.tmpl/actions.html',
        scope: false,
        require: "^scenaristHistoryIndex",
        link : function($scope, element, attrs, parentCtrl) {

            $parent = parentCtrl;
            $scope.addVersion = function() {
                parentCtrl.addVersion();
            };

            $scope.copyScenario = function() {
                parentCtrl.copyScenario();
            };
        }
    };
})
.directive('scenaristHistoryDownloadJson', function(ScenariosModel){
    return {
        scope: false,
        link : function(scope, element, attrs, parentCtrl) {
            $jsonElement = element;
            scope.$watch("scenario", function(n,o) {
                if (_.contains([false,undefined], n)) {
                    $jsonElement.addClass('disabled').attr('href', '#');
                } else {
                    var url = ServiceURL + "rest/Export/GameModel/" + n.id + "/" + n.name + ".json";
                    $jsonElement.removeClass('disabled').attr('href', url);
                }
                scope.scenario = n;
            });


        }
    };
})
.directive('scenaristHistoryDownloadPdf', function(ScenariosModel){
    return {
        scope: false,
        link : function(scope, element, attrs, parentCtrl) {
            $pdfElement = element;

            scope.$watch("scenario", function(n,o) {
                if (_.contains([false,undefined], n)) {
                    $pdfElement.addClass('disabled').attr('href', '#');
                } else {
                    var url = ServiceURL + "print.html?gameModelId=" + n.id
                            + "&outputType=pdf&mode=editor&defaultValues=true";
                    $pdfElement.removeClass('disabled').attr('href', url);
                }
                scope.scenario = n;
            });


        }
    };
})
.directive('scenaristHistoryList', function(ScenariosModel){
    return {
        templateUrl: 'app/private/scenarist/history/directives.tmpl/list.html',
        scope: false,
        require: "^scenaristHistoryIndex",
        link : function(scope, element, attrs, parentCtrl) {

            scope.$watch(function() {
                return parentCtrl.scenario
            } , function(n,o) {
                scope.scenario = n;
            });
            scope.$watch(function() {
                return parentCtrl.versions
            } , function(n,o) {
                scope.versions = n;
            });

        }
    };
})
.directive('scenaristHistoryCard', function(ScenariosModel){
    return {
        templateUrl: 'app/private/scenarist/history/directives.tmpl/card.html',
        scope: false,
        require: "^scenaristHistoryIndex",
        link : function($scope, element, attrs, parentCtrl) {

            $scope.deleteFork = function(name) {
                var forkName = name;
                ScenariosModel.deleteVersionHistory($scope.scenarioId, name).then(function (response) {
                    if (response.isErroneous()) {
                        response.flash();
                    } else {
                        var index = _.findIndex($scope.versions, function(v) {
                            return v.name === name;
                        });
                        if (index > -1) {
                            $scope.versions.splice(index, 1);
                        }
                    }
                });
            };

            $scope.createFork = function(name) {
                parentCtrl.createFork(name);
            };

        }
    };
});