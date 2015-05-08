angular.module('private.scenarist.settings.directives', [
    'wegas.service.customize'
])
    .directive('scenaristSettingsIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/scenarist/settings/directives.tmpl/index.html',
            controller: "ScenaristSettingsIndexController as settingsIndexCtrl"
        };
    }).controller("ScenaristSettingsIndexController", function ScenaristSettingsIndexController($rootScope, $scope, $stateParams, ScenariosModel, Flash) {
        var ctrl = this,
            initTabs = function() {
                return {
                    infos: false,
                    display: false
                };
            };
        ctrl.MAX_DISPLAYED_CHARS = MAX_DISPLAYED_CHARS;
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
            pagesUri: false
        };
        ctrl.infos = {
            name : "",
            comments :"",
            color: "orange",
            icon:"gamepad",
            individual: false,
            scriptUri: "",
            clientScriptUri: "",
            cssUri: "",
            pagesUri: ""
        };
        ctrl.tabs = initTabs();

        ctrl.updateScenario = function() {
            ScenariosModel.getScenario("LIVE", $stateParams.scenarioId, true).then(function(response) {
                ctrl.scenario = response.data || {};
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    var icon = ctrl.scenario.properties.iconUri.split("_");
                    if (icon.length == 3 && icon[0] == "ICON") {
                        ctrl.infos.color = icon[1];
                        ctrl.infos.icon = icon[2];
                    }
                    ctrl.infos.name = ctrl.scenario.name;
                    ctrl.infos.comments = ctrl.scenario.comments;
                    ctrl.infos.individual = ctrl.scenario.properties.freeForAll;
                    ctrl.infos.scriptUri = ctrl.scenario.properties.scriptUri;
                    ctrl.infos.clientScriptUri = ctrl.scenario.properties.clientScriptUri;
                    ctrl.infos.cssUri = ctrl.scenario.properties.cssUri;
                    ctrl.infos.pagesUri = ctrl.scenario.properties.pagesUri;

               }
            });
        };

        ctrl.checkChanges = function(type, changes){
            if(ctrl.scenario['@class'] == "GameModel"){
                var oldColor = "orange",
                    oldIcon = "gamepad",
                    icon = ctrl.scenario.properties.iconUri.split("_");
                if (icon.length == 3 && icon[0] == "ICON") {
                    oldColor = icon[1];
                    oldIcon = icon[2];
                }
                switch(type){
                    case "color":
                        ctrl.hasChanges.color = (oldColor !== changes);
                        break;
                    case "icon":
                        ctrl.hasChanges.icon = (oldIcon !== changes);
                        break;
                    case "name":
                        ctrl.hasChanges.name = (ctrl.scenario.name !== changes);
                        break;
                    case "comments":
                        ctrl.hasChanges.comments = (ctrl.scenario.comments !==  changes);
                        break;
                    case "individual":
                        ctrl.hasChanges.individual = (ctrl.scenario.properties.freeForAll !==  changes);
                        break;
                    case "scriptUri":
                        ctrl.hasChanges.scriptUri = (ctrl.scenario.properties.scriptUri !==  changes);
                        break;
                    case "clientScriptUri":
                        ctrl.hasChanges.clientScriptUri = (ctrl.scenario.properties.clientScriptUri !==  changes);
                        break;
                    case "cssUri":
                        ctrl.hasChanges.cssUri = (ctrl.scenario.properties.cssUri !==  changes);
                        break;
                    case "pages":
                        ctrl.hasChanges.pagesUri = (ctrl.scenario.properties.pagesUri !==  changes);
                        break;

                }
                ctrl.hasChanges.all = ctrl.hasChanges.color || ctrl.hasChanges.icon ||
                                    ctrl.hasChanges.name || ctrl.hasChanges.comments ||
                                    ctrl.hasChanges.individual || ctrl.hasChanges.scriptUri ||
                                    ctrl.hasChanges.clientScriptUri || ctrl.hasChanges.cssUri ||
                                    ctrl.hasChanges.pagesUri;
            }
        };

        ctrl.activeTab = function(tab) {
            ctrl.tabs = initTabs();
            ctrl.tabs[tab] = true;
        }

        ctrl.changeColor = function(newColor) {
            ctrl.infos.color = newColor;
            ctrl.checkChanges("color", newColor);
        }
        ctrl.changeIcon = function(newIcon) {
            ctrl.infos.icon = newIcon;
            ctrl.checkChanges("icon", newIcon);
        }

        ctrl.save = function() {
            ScenariosModel.updateScenario(ctrl.scenario.id, ctrl.infos).then(function(response){
                if(!response.isErroneous()){
                    $rootScope.$emit("changeScenarios", true);
                    $scope.close();
                }else{
                    response.flash();
                }
            });
        };

        ctrl.cancel = function(){
            $scope.close();
        };

        $scope.$watch(function(){
            return ctrl.infos.name;
        }, function(newName){
            ctrl.checkChanges("name", newName);
        });

        $scope.$watch(function(){
            return ctrl.infos.comments;
        }, function(newComments){
            ctrl.checkChanges("comments", newComments);
        });

        $scope.$watch(function(){
            return ctrl.infos.individual;
        }, function(newIndividual){
            ctrl.checkChanges("individual", newIndividual);
        });

        $scope.$watch(function(){
            return ctrl.infos.scriptUri;
        }, function(newScriptUri){
            ctrl.checkChanges("scriptUri", newScriptUri);
        });
        $scope.$watch(function(){
            return ctrl.infos.clientScriptUri;
        }, function(newClientScriptUri){
            ctrl.checkChanges("clientScriptUri", newClientScriptUri);
        });
        $scope.$watch(function(){
            return ctrl.infos.cssUri;
        }, function(newCssUri){
            ctrl.checkChanges("cssUri", newCssUri);
        });
        $scope.$watch(function(){
            return ctrl.infos.pagesUri;
        }, function(newPagesUri){
            ctrl.checkChanges("pagesUri", newPagesUri);
        });
        ctrl.updateScenario();
        ctrl.activeTab("infos");
    })
    .directive('scenaristCustomizeInfos', function() {
        return {
            scope:{
                activeInfos: "="
            },
            templateUrl: 'app/private/scenarist/settings/directives.tmpl/infos-form.html'
        }
    })
    .directive('scenaristCustomizeAdvanced', function() {
        return {
            scope:{
                activeInfos: "="
            },
            templateUrl: 'app/private/scenarist/settings/directives.tmpl/infos-advanced.html'
        }
    })
    .directive('scenaristCustomizeIcons', function(Customize) {
        return {
            templateUrl: 'app/private/scenarist/settings/directives.tmpl/icons-picker.html',
            scope: {
                activeIcon: "=",
                change: "="
            },
            link: function(scope, element, attrs) {
                scope.icons = Customize.iconsPalette();
            }
        }
    })
    .directive('scenaristCustomizeColors', function(Customize) {
        return {
            templateUrl: 'app/private/scenarist/settings/directives.tmpl/colors-picker.html',
            scope: {
                activeColor: "=",
                change: "="
            },
            link: function(scope, element, attrs) {
                scope.colors = Customize.colorsPalette();
            }
        }
    })
    ;