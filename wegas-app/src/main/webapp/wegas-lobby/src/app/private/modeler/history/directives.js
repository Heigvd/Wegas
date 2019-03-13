angular
    .module('private.modeler.history.directives', [
        'ngSanitize'
    ])
    .directive('modelerHistoryIndex', function(ScenariosModel) {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/modeler/history/directives.tmpl/index.html',
            controller: function($scope, $stateParams, $sce, $rootScope) {
                var ctrl = this;

                ctrl.model = undefined;
                ctrl.modelId = $stateParams.modelId;

                ctrl.updateVersions = function() {
                    ScenariosModel.getVersionsHistory(ctrl.model.id).then(function(response) {
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
                    ScenariosModel.restoreVersionHistory(ctrl.modelId, name).then(function(response) {
                        response.flash();
                        if (!response.isErroneous()) {
                            $rootScope.$emit('changeModels', true);
                        }
                    });
                };
                ctrl.copyModel = function() {
                    ScenariosModel.copyScenario(ctrl.modelId).then(function(response) {
                        if (!response.isErroneous()) {
                            response.flash();
                            $rootScope.$emit('changeModels', true);
                        }
                    });
                };
                ctrl.addVersion = function() {
                    ScenariosModel.addVersionHistory(ctrl.modelId).then(function(response) {
                        if (response.isErroneous()) {
                            response.flash();
                        } else {
                            ctrl.updateVersions();
                        }
                    });
                };
                ScenariosModel.getModel("LIVE", ctrl.modelId).then(function(response) {
                    ctrl.model = response.data;
                    ctrl.updateVersions();
                });

                $scope.modelerHistoryIndexCtrl = this;
            }
        };
    })
    .directive('modelerHistoryActions', function(ScenariosModel) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/history/directives.tmpl/actions.html',
            scope: {
               model: "="
            },
            require: "^modelerHistoryIndex",
            link: function($scope, element, attrs, parentCtrl) {
                $scope.addVersion = function() {
                    parentCtrl.addVersion();
                };

                $scope.copyModel = function() {
                    parentCtrl.copyModel();
                };
            }
        };
    })
    .directive('modelerHistoryDownloadJson', function(ScenariosModel) {
        "use strict";
        return {
            scope: {
                model: "="
            },
            link: function(scope, element, attrs, parentCtrl) {
                var $jsonElement = element;

                scope.$watch("model", function(n, o) {
                    if (_.contains([false, undefined], n)) {
                        $jsonElement.addClass('disabled').attr('href', '#');
                    } else {
                        var url = window.ServiceURL + "rest/Export/GameModel/" + n.id + "/" + n.name + ".json";
                        $jsonElement.removeClass('disabled').attr('href', url);
                    }
                    scope.model = n;
                });


            }
        };
    })
    .directive('modelerHistoryDownloadPdf', function(ScenariosModel) {
        "use strict";
        return {
            scope: {
                model: "="
            },
            link: function(scope, element, attrs, parentCtrl) {
                var $pdfElement = element;

                scope.$watch("model", function(n, o) {
                    if (_.contains([false, undefined], n)) {
                        $pdfElement.addClass('disabled').attr('href', '#');
                    } else {
                        var url = window.ServiceURL + "print.html?gameModelId=" + n.id +
                            "&outputType=pdf&mode=editor&defaultValues=true";
                        $pdfElement.removeClass('disabled').attr('href', url);
                    }
                    scope.model = n;
                });


            }
        };
    })
    .directive('modelerHistoryList', function(ScenariosModel) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/history/directives.tmpl/list.html',
            scope: false,
            require: "^modelerHistoryIndex",
            link: function(scope, element, attrs, parentCtrl) {

                scope.$watch(function() {
                    return parentCtrl.model;
                }, function(n, o) {
                    scope.model = n;
                });
                scope.$watch(function() {
                    return parentCtrl.versions;
                }, function(n, o) {
                    scope.versions = n;
                });

            }
        };
    })
    .directive('modelerHistoryCard', function(ScenariosModel) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/history/directives.tmpl/card.html',
            scope: false,
            require: "^modelerHistoryIndex",
            link: function($scope, element, attrs, parentCtrl) {

                $scope.deleteFork = function(name) {
                    ScenariosModel.deleteVersionHistory($scope.model.id, name).then(function(response) {
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
