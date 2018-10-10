angular.module('private.modeler.settings.directives', [
    'wegas.service.customize'
])
    .directive('modelerSettingsIndex', function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/modeler/settings/directives.tmpl/index.html',
            controller: "ModelerSettingsIndexController as settingsIndexCtrl"
        };
    })
    .controller("ModelerSettingsIndexController", function ModelerSettingsIndexController($rootScope, $scope, $stateParams, ScenariosModel, Flash) {
        "use strict";
        var ctrl = this,
            initTabs = function() {
                return {
                    infos: false,
                    display: false
                };
            };
        ctrl.model = {};
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

        ctrl.updateModel = function() {
            ScenariosModel.getScenario("LIVE", $stateParams.modelId, "MODEL").then(function(response) {
                ctrl.model = response.data || {};
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    var icon = ctrl.model.properties.iconUri.split("_");
                    if (icon.length >= 3 && icon[0] === "ICON") {
                        ctrl.infos.color = icon[1];
                        ctrl.infos.icon.key = icon[2];
                        if (icon[3]) {
                            ctrl.infos.icon.library = icon[3];
                        }
                    }
                    ctrl.infos.name = ctrl.model.name;
                    ctrl.infos.comments = ctrl.model.comments;
                    ctrl.infos.individual = ctrl.model.properties.freeForAll;
                    ctrl.infos.scriptUri = ctrl.model.properties.scriptUri;
                    ctrl.infos.clientScriptUri = ctrl.model.properties.clientScriptUri;
                    ctrl.infos.cssUri = ctrl.model.properties.cssUri;
                    ctrl.infos.pagesUri = ctrl.model.properties.pagesUri;
                    ctrl.infos.logID = ctrl.model.properties.logID;
                    ctrl.infos.guestAllowed = ctrl.model.properties.guestAllowed;
                }
            });
        };

        ctrl.checkChanges = function(type, changes) {
            if (ctrl.model['@class'] === "GameModel") {
                var oldColor = "orange",
                    oldIcon = "gamepad",
                    oldLibrary = "fa",
                    icon = ctrl.model.properties.iconUri.split("_");
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
                        ctrl.hasChanges.name = (ctrl.model.name !== changes);
                        break;
                    case "comments":
                        ctrl.hasChanges.comments = (ctrl.model.comments !== changes);
                        break;
                    case "individual":
                        ctrl.hasChanges.individual = (ctrl.model.properties.freeForAll !== changes);
                        break;
                    case "scriptUri":
                        ctrl.hasChanges.scriptUri = (ctrl.model.properties.scriptUri !== changes);
                        break;
                    case "clientScriptUri":
                        ctrl.hasChanges.clientScriptUri = (ctrl.model.properties.clientScriptUri !== changes);
                        break;
                    case "cssUri":
                        ctrl.hasChanges.cssUri = (ctrl.model.properties.cssUri !== changes);
                        break;
                    case "pages":
                        ctrl.hasChanges.pagesUri = (ctrl.model.properties.pagesUri !== changes);
                        break;
                    case "logID":
                        ctrl.hasChanges.logID = (ctrl.model.properties.logID !== changes);
                        break;
                    case "guestAllowed":
                        ctrl.hasChanges.guestAllowed = (ctrl.model.properties.guestAllowed !== changes);
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
            ScenariosModel.updateScenario(ctrl.model.id, ctrl.infos, "MODEL").then(function(response) {
                if (!response.isErroneous()) {
                    $rootScope.$emit("changeModels", true);
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

        ctrl.updateModel();
        ctrl.activeTab("infos");
    })
    .directive('modelerCustomizeInfos', function() {
        "use strict";
        return {
            scope: {
                activeInfos: "="
            },
            templateUrl: 'app/private/modeler/settings/directives.tmpl/infos-form.html'
        };
    })
    .directive('modelerCustomizeAdvanced', function() {
        "use strict";
        return {
            scope: {
                activeInfos: "="
            },
            templateUrl: 'app/private/modeler/settings/directives.tmpl/infos-advanced.html'
        };
    })
    .directive('modelerCustomizeIcons', function(Customize) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/settings/directives.tmpl/icons-picker.html',
            scope: {
                activeIcon: "=",
                change: "="
            },
            link: function(scope, element, attrs) {
                scope.icons = Customize.iconsPalette();
            }
        };
    })
    .directive('modelerCustomizeColors', function(Customize) {
        "use strict";
        return {
            templateUrl: 'app/private/modeler/settings/directives.tmpl/colors-picker.html',
            scope: {
                activeColor: "=",
                change: "="
            },
            link: function(scope, element, attrs) {
                scope.colors = Customize.colorsPalette();
            }
        };
    });
