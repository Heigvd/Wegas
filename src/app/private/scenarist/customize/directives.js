angular.module('private.scenarist.customize.directives', [
    'wegas.service.customize'
])
    .directive('scenaristCustomizeIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/scenarist/customize/directives.tmpl/index.html',
            controller: "ScenaristCustomizeIndexController as customizeIndexCtrl"
        };
    }).controller("ScenaristCustomizeIndexController", function ScenaristCustomizeIndexController($rootScope, $scope, $stateParams, ScenariosModel, Flash) {
        var ctrl = this,
            initTabs = function() {
                return {
                    infos: false,
                    display: false
                }
            };
        ctrl.scenario = {};
        ctrl.hasChanges = {
            all: false,
            color: false,
            icon: false, 
            name: false,
            comment: false, 
            individual: false
        };
        ctrl.infos = {
            name : "",
            comments :"",
            color: "orange",
            icon:"gamepad",
            individual: false
        };
        ctrl.tabs = initTabs();
            
        ctrl.updateScenario = function() {
            ScenariosModel.getScenario("LIVE", $stateParams.scenarioId, true).then(function(response) {
                ctrl.scenario = response.data || {};                
                if (response.isErroneous()) {
                    response.flash();
                }else{
                    var icon = ctrl.scenario.properties.iconUri.split("_");
                    if (icon.length == 3 && icon[0] == "ICON") {
                        ctrl.infos.color = icon[1];
                        ctrl.infos.icon = icon[2];
                    }
                    ctrl.infos.name = ctrl.scenario.name;
                    ctrl.infos.comments = ctrl.scenario.comments;
                    ctrl.infos.individual = ctrl.scenario.properties.freeForAll; 
               }
            });
        };

        ctrl.checkChanges = function(type, changes){
            if(ctrl.scenario['@class'] == "Game"){
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
                }
                ctrl.hasChanges.all =   ctrl.hasChanges.color || ctrl.hasChanges.icon || ctrl.hasChanges.name || ctrl.hasChanges.comments || ctrl.hasChanges.individual;
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

        ctrl.updateScenario();
        ctrl.activeTab("infos");
    })
    .directive('scenaristCustomizeInfos', function() {
        return {
            scope:{
                activeInfos: "="
            },
            templateUrl: 'app/private/scenarist/customize/directives.tmpl/infos-form.html'
        }
    })
    .directive('scenaristCustomizeIcons', function(Customize) {
        return {
            templateUrl: 'app/private/scenarist/customize/directives.tmpl/icons-picker.html',
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
            templateUrl: 'app/private/scenarist/customize/directives.tmpl/colors-picker.html',
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