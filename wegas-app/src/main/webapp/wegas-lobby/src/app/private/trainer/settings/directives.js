angular.module('private.trainer.settings.directives', [
    'wegas.service.customize'
])
    .directive('trainerSessionsSettingsIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/settings/directives.tmpl/index.html',
            controller: "TrainerSettingsIndexController as settingsIndexCtrl"
        };
    }).controller("TrainerSettingsIndexController", function TrainerSettingsIndexController($rootScope, $scope, $stateParams, SessionsModel, Flash) {
        var ctrl = this,
            initTabs = function() {
                return {
                    infos: false,
                    display: false
                }
            };
        ctrl.MAX_DISPLAYED_CHARS = MAX_DISPLAYED_CHARS;
        ctrl.session = {};
        ctrl.hasChanges = {
            all: false,
            color: false,
            icon: false, 
            name: false,
            comment: false, 
            token: false,
            individual: false
        };
        ctrl.infos = {
            name : "",
            token : "", 
            comments :"",
            color: "orange",
            icon:"gamepad",
            scenario: "",
            individual: false
        };
        ctrl.tabs = initTabs();
            
        ctrl.updateSession = function() {
            SessionsModel.getSession("managed", $stateParams.id, true).then(function(response) {
                ctrl.session = response.data || {};                
                if (response.isErroneous()) {
                    response.flash();
                }else{
                    var icon = ctrl.session.properties.iconUri.split("_");
                    if (icon.length == 3 && icon[0] == "ICON") {
                        ctrl.infos.color = icon[1];
                        ctrl.infos.icon = icon[2];
                    }
                    ctrl.infos.name = ctrl.session.name;
                    ctrl.infos.token = ctrl.session.token;
                    ctrl.infos.comments = ctrl.session.gameModel.comments;
                    ctrl.infos.scenario = ctrl.session.gameModel.name;
                    ctrl.infos.individual = ctrl.session.properties.freeForAll; 
               }
            });
        };

        ctrl.checkChanges = function(type, changes){
            if(ctrl.session['@class'] == "Game"){
                var oldColor = "orange",
                    oldIcon = "gamepad",
                    icon = ctrl.session.properties.iconUri.split("_");
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
                        ctrl.hasChanges.name = (ctrl.session.name !== changes);
                        break;
                    case "token":
                        ctrl.hasChanges.token = (ctrl.session.token !==  changes);
                        break;
                    case "comments":
                        ctrl.hasChanges.comments = (ctrl.session.gameModel.comments !==  changes);
                        break;
                    case "individual": 
                        ctrl.hasChanges.individual = (ctrl.session.properties.freeForAll !==  changes);

                }
                ctrl.hasChanges.all =   ctrl.hasChanges.color || ctrl.hasChanges.icon || ctrl.hasChanges.name || ctrl.hasChanges.token || ctrl.hasChanges.comments || ctrl.hasChanges.individual;
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
            SessionsModel.updateSession(ctrl.session.id, ctrl.infos).then(function(response){
                if(!response.isErroneous()){
                    $rootScope.$emit("changeSessions", true);
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
            return ctrl.infos.token;
        }, function(newToken){
            ctrl.checkChanges("token", newToken);
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

        ctrl.updateSession();
        ctrl.activeTab("infos");
    })
    .directive('trainerSessionsCustomizeInfos', function() {
        return {
            scope:{
                activeInfos: "="
            },
            templateUrl: 'app/private/trainer/settings/directives.tmpl/infos-form.html'
        }
    })
    .directive('trainerSessionsCustomizeIcons', function(Customize) {
        return {
            templateUrl: 'app/private/trainer/settings/directives.tmpl/icons-picker.html',
            scope: {
                activeIcon: "=",
                change: "="
            },
            link: function(scope, element, attrs) {
                scope.icons = Customize.iconsPalette();
            }
        }
    })
    .directive('trainerSessionsCustomizeColors', function(Customize) {
        return {
            templateUrl: 'app/private/trainer/settings/directives.tmpl/colors-picker.html',
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