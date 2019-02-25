angular.module('private.scenarist.settings.directives', [
    'wegas.service.customize'
])
    .directive('scenaristSettingsIndex', function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/scenarist/settings/directives.tmpl/index.html',
            controller: "ScenaristSettingsIndexController as settingsIndexCtrl"
        };
    })
    .controller("ScenaristSettingsIndexController", function ScenaristSettingsIndexController($rootScope, $scope, $stateParams, ScenariosModel, Flash) {
        "use strict";
        var ctrl = this,
            initTabs = function() {
                return {
                    infos: false,
                    display: false
                };
            };
        ctrl.scenario = {};
        ctrl.hasChanges = {
            all: false,
            color: false,
            icon: false,
            name: false,
            comment: false,
            individual: false,
            scriptUri: false,
            clientScriptUri: false,
            cssUri: false,
            pagesUri: false,
            logID: false,
            guestAllowed: false
        };
        ctrl.infos = {
            name: "",
            comments: "",
            color: "orange",
            icon: {
                key: "gamepad",
                library: 'fa'
            },
            individual: false,
            scriptUri: "",
            clientScriptUri: "",
            cssUri: "",
            pagesUri: "",
            logID: "",
            guestAllowed : false
        };
        ctrl.tabs = initTabs();

        ctrl.updateScenario = function() {

            ScenariosModel.getScenario("LIVE", $stateParams.scenarioId).then(function(response) {
                ctrl.scenario = response.data || {};
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    var icon = ctrl.scenario.properties.iconUri.split("_");
                    if (icon.length >= 3 && icon[0] === "ICON") {
                        ctrl.infos.color = icon[1];
                        ctrl.infos.icon.key = icon[2];
                        if (icon[3]) {
                            ctrl.infos.icon.library = icon[3];
                        }
                    }
                    ctrl.infos.name = ctrl.scenario.name;
                    ctrl.infos.comments = ctrl.scenario.comments;
                    ctrl.infos.individual = ctrl.scenario.properties.freeForAll;
                    ctrl.infos.scriptUri = ctrl.scenario.properties.scriptUri;
                    ctrl.infos.clientScriptUri = ctrl.scenario.properties.clientScriptUri;
                    ctrl.infos.cssUri = ctrl.scenario.properties.cssUri;
                    ctrl.infos.pagesUri = ctrl.scenario.properties.pagesUri;
                    ctrl.infos.logID = ctrl.scenario.properties.logID;
                    ctrl.infos.guestAllowed = ctrl.scenario.properties.guestAllowed;
                }
            });
        };

        ctrl.checkChanges = function(type, changes) {
            if (ctrl.scenario['@class'] === "GameModel") {
                var oldColor = "orange",
                    oldIcon = "gamepad",
                    oldLibrary = "fa",
                    icon = ctrl.scenario.properties.iconUri.split("_");
                if (icon.length >= 3 && icon[0] === "ICON") {
                    oldColor = icon[1];
                    oldIcon = icon[2];
                    oldLibrary = icon[3] || 'fa';
                }
                switch (type) {
                    case "color":
                        ctrl.hasChanges.color = (oldColor !== changes);
                        break;
                    case "icon":
                        ctrl.hasChanges.icon = (oldIcon !== changes.key) || (oldLibrary !== changes.library);
                        break;
                    case "name":
                        ctrl.hasChanges.name = (ctrl.scenario.name !== changes);
                        break;
                    case "comments":
                        ctrl.hasChanges.comments = (ctrl.scenario.comments !== changes);
                        break;
                    case "individual":
                        ctrl.hasChanges.individual = (ctrl.scenario.properties.freeForAll !== changes);
                        break;
                    case "scriptUri":
                        ctrl.hasChanges.scriptUri = (ctrl.scenario.properties.scriptUri !== changes);
                        break;
                    case "clientScriptUri":
                        ctrl.hasChanges.clientScriptUri = (ctrl.scenario.properties.clientScriptUri !== changes);
                        break;
                    case "cssUri":
                        ctrl.hasChanges.cssUri = (ctrl.scenario.properties.cssUri !== changes);
                        break;
                    case "pages":
                        ctrl.hasChanges.pagesUri = (ctrl.scenario.properties.pagesUri !== changes);
                        break;
                    case "logID":
                        ctrl.hasChanges.logID = (ctrl.scenario.properties.logID !== changes);
                        break;
                    case "guestAllowed":
                        ctrl.hasChanges.guestAllowed = (ctrl.scenario.properties.guestAllowed !== changes);
                        break;

                }
                ctrl.hasChanges.all = ctrl.hasChanges.color || ctrl.hasChanges.icon ||
                    ctrl.hasChanges.name || ctrl.hasChanges.comments ||
                    ctrl.hasChanges.individual || ctrl.hasChanges.scriptUri ||
                    ctrl.hasChanges.clientScriptUri || ctrl.hasChanges.cssUri ||
                    ctrl.hasChanges.pagesUri || ctrl.hasChanges.logID || ctrl.hasChanges.guestAllowed;
            }
        };

        ctrl.activeTab = function(tab) {
            ctrl.tabs = initTabs();
            ctrl.tabs[tab] = true;
        };

        ctrl.changeColor = function(newColor) {
            ctrl.infos.color = newColor;
            ctrl.checkChanges("color", newColor);
        };
        ctrl.changeIcon = function(iconKey, iconLib) {
            ctrl.infos.icon = {
                key: iconKey,
                library: iconLib
            };
            ctrl.checkChanges("icon", ctrl.infos.icon);
        };

        ctrl.save = function() {
            ScenariosModel.updateScenario(ctrl.scenario.id, ctrl.infos).then(function(response) {
                if (!response.isErroneous()) {
                    $rootScope.$emit("changeScenarios", true);
                    $scope.close();
                } else {
                    response.flash();
                }
            });
        };

        ctrl.cancel = function() {
            $scope.close();
        };

        var properties = ["name", "comments", "individual", "scriptUri", "clientScriptUri", "cssUri", "pagesUri", "logID", "guestAllowed"];

        _.each(properties, function(el, index) {
            $scope.$watch(function() {
                return ctrl.infos[el];
            }, function(newValue) {
                ctrl.checkChanges(el, newValue);
            });
        });

        ctrl.updateScenario();
        ctrl.activeTab("infos");
    })
    .directive('scenaristCustomizeInfos', function() {
        "use strict";
        return {
            scope: {
                activeInfos: "="
            },
            templateUrl: 'app/private/scenarist/settings/directives.tmpl/infos-form.html'
        };
    })
.directive('scenaristCustomizeAdvanced', function() {
        "use strict";
        return {
            scope: {
                activeInfos: "="
            },
            templateUrl: 'app/private/scenarist/settings/directives.tmpl/infos-advanced.html'
        };
    })
    .directive('scenaristCustomizeIcons', function(Customize) {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/settings/directives.tmpl/icons-picker.html',
            scope: {
                activeIcon: "=",
                change: "="
            },
            link: function(scope, element, attrs) {
                scope.icons = Customize.iconsPalette();
            }
        };
    })
    .directive('scenaristCustomizeColors', function(Customize) {
        "use strict";
        return {
            templateUrl: 'app/private/scenarist/settings/directives.tmpl/colors-picker.html',
            scope: {
                activeColor: "=",
                change: "="
            },
            link: function(scope, element, attrs) {
                scope.colors = Customize.colorsPalette();
            }
        };
    });
