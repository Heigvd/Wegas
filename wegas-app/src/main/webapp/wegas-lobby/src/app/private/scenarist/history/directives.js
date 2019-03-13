angular
    .module('private.scenarist.history.directives', [
        'ngSanitize'
    ])
    .directive('scenaristHistoryIndex', function(ScenariosModel) {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/scenarist/history/directives.tmpl/index.html',
            controller: function($scope, $stateParams, $sce, $rootScope) {
                var ctrl = this;

                ctrl.scenario = undefined;
                ctrl.scenarioId = $stateParams.scenarioId;

                ctrl.updateVersions = function() {
                    ScenariosModel.getVersionsHistory(ctrl.scenario.id).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                        } else {
                            response.data.forEach(function(version) {
                                version.date = new Date(version.dataLastModified);
                                var splitted = version.name.split("by ");

                                if (splitted.length > 1) {
                                    version.author = splitted[1].split(".")[0];
                                } else {
                                    version.author = "anonymous";
                                }
                            });
                            ctrl.versions = response.data;
                        }
                    });
                };
                ctrl.createFork = function(name) {
                    ScenariosModel.restoreVersionHistory(ctrl.scenarioId, name).then(function(response) {
                        response.flash();
                        if (!response.isErroneous()) {
                            $rootScope.$emit('changeScenarios', true);
                        }
                    });
                };
                ctrl.copyScenario = function() {
                    ScenariosModel.copyScenario(ctrl.scenarioId).then(function(response) {
                        if (!response.isErroneous()) {
                            response.flash();
                            $rootScope.$emit('changeScenarios', true);
                        }
                    });
                };
                ctrl.addVersion = function() {
                    ScenariosModel.addVersionHistory(ctrl.scenarioId).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                        } else {
                            ctrl.updateVersions();
                        }
                    });
                };
                ScenariosModel.getScenario("LIVE", ctrl.scenarioId).then(function(response) {
                    ctrl.scenario = response.data;
                    ctrl.updateVersions();
                });

                $scope.scenaristHistoryIndexCtrl = this;
            }
        };
    })
    .directive('scenaristHistoryActions', function(ScenariosModel) {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/history/directives.tmpl/actions.html',
            scope: {
                scenario: "="
            },
            require: "^scenaristHistoryIndex",
            link: function($scope, element, attrs, parentCtrl) {
                $scope.addVersion = function() {
                    parentCtrl.addVersion();
                };

                $scope.copyScenario = function() {
                    parentCtrl.copyScenario();
                };
            }
        };
    })
    .directive('scenaristHistoryDownloadJson', function(ScenariosModel) {
        "use strict";
        return {
            scope: {
                scenario: "="
            },
            link: function(scope, element, attrs, parentCtrl) {
                var $jsonElement = element;

                scope.$watch("scenario", function(n, o) {
                    if (_.contains([false, undefined], n)) {
                        $jsonElement.addClass('disabled').attr('href', '#');
                    } else {
                        var url = window.ServiceURL + "rest/Export/GameModel/" + n.id + "/" + n.name + ".json";
                        $jsonElement.removeClass('disabled').attr('href', url);
                    }
                    scope.scenario = n;
                });


            }
        };
    })
    .directive('scenaristHistoryDownloadWgz', function(ScenariosModel) {
        "use strict";
        return {
            scope: {
                scenario: "="
            },
            link: function(scope, element, attrs, parentCtrl) {
                var $jsonElement = element;

                scope.$watch("scenario", function(n, o) {
                    if (_.contains([false, undefined], n)) {
                        $jsonElement.addClass('disabled').attr('href', '#');
                    } else {
                        var url = window.ServiceURL + "rest/Export/GameModel/" + n.id + ".wgz";
                        $jsonElement.removeClass('disabled').attr('href', url);
                    }
                    scope.scenario = n;
                });


            }
        };
    })
    .directive('scenaristHistoryDownloadPdf', function(ScenariosModel) {
        "use strict";
        return {
            scope: {
                scenario: "="
            },
            link: function(scope, element, attrs, parentCtrl) {
                var $pdfElement = element;

                scope.$watch("scenario", function(n, o) {
                    if (_.contains([false, undefined], n)) {
                        $pdfElement.addClass('disabled').attr('href', '#');
                    } else {
                        var url = window.ServiceURL + "print.html?gameModelId=" + n.id +
                            "&outputType=pdf&mode=editor&defaultValues=true";
                        $pdfElement.removeClass('disabled').attr('href', url);
                    }
                    scope.scenario = n;
                });


            }
        };
    })
    .directive('scenaristHistoryList', function(ScenariosModel) {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/history/directives.tmpl/list.html',
            scope: false,
            require: "^scenaristHistoryIndex",
            link: function(scope, element, attrs, parentCtrl) {

                scope.$watch(function() {
                    return parentCtrl.scenario;
                }, function(n, o) {
                    scope.scenario = n;
                });
                scope.$watch(function() {
                    return parentCtrl.versions;
                }, function(n, o) {
                    scope.versions = n;
                });

            }
        };
    })
    .directive('scenaristHistoryCard', function(ScenariosModel) {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/history/directives.tmpl/card.html',
            scope: false,
            require: "^scenaristHistoryIndex",
            link: function($scope, element, attrs, parentCtrl) {

                $scope.deleteFork = function(name) {
                    ScenariosModel.deleteVersionHistory($scope.scenario.id, name).then(function(response) {
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
