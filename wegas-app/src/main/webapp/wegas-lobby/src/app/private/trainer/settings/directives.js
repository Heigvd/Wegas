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
    }).controller("TrainerSettingsIndexController", function TrainerSettingsIndexController($rootScope, $scope, $state, $stateParams, SessionsModel, Flash) {
        var ctrl = this,
            initTabs = function() {
                return {
                    infos: false,
                    display: false,
                    advanced: false
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
            individual: false,
            scriptUri: false,
            clientScriptUri: false,
            cssUri: false,
            pagesUri: false,
            logID: false
        };
        ctrl.infos = {
            name : "",
            token : "", 
            comments :"",
            color: "orange",
            icon:{
                key:"gamepad",
                library:'fa'
            },
            scenario: "",
            individual: false,
            scriptUri: "",
            clientScriptUri: "",
            cssUri: "",
            pagesUri: "",
            logID: ""
        };
        ctrl.tabs = initTabs();

        ctrl.kindsOfSession = ($state.$current.name == "wegas.private.trainer.settings") ? "LIVE" : "BIN";

        ctrl.updateSession = function() {
            SessionsModel.getSession(ctrl.kindsOfSession, $stateParams.id, true).then(function(response) {
                ctrl.session = response.data || {};
                if (response.isErroneous()) {
                    response.flash();
                }else{
                    var icon = ctrl.session.properties.iconUri.split("_");
                    if (icon.length >= 3 && icon[0] == "ICON") {
                        ctrl.infos.color = icon[1];
                        ctrl.infos.icon.key = icon[2];
                        if(icon[3]){
                            ctrl.infos.icon.library = icon[3];
                        }
                    }
                    ctrl.infos.name = ctrl.session.name;
                    ctrl.infos.token = ctrl.session.token;
                    ctrl.infos.comments = ctrl.session.gameModel.comments;
                    ctrl.infos.scenario = ctrl.session.gameModel.name;
                    ctrl.infos.individual = ctrl.session.properties.freeForAll; 
                    ctrl.infos.scriptUri = ctrl.session.gameModel.properties.scriptUri;
                    ctrl.infos.clientScriptUri = ctrl.session.gameModel.properties.clientScriptUri;
                    ctrl.infos.cssUri = ctrl.session.gameModel.properties.cssUri;
                    ctrl.infos.pagesUri = ctrl.session.gameModel.properties.pagesUri;
                    ctrl.infos.logID = ctrl.session.gameModel.properties.logID;
               }
            });
        };

        ctrl.checkChanges = function(type, changes){
            if(ctrl.session['@class'] == "Game"){
                var oldColor = "orange",
                    oldIcon = "gamepad",
                    oldLibrary = "fa",
                    icon = ctrl.session.properties.iconUri.split("_");
                if (icon.length >= 3 && icon[0] == "ICON") {
                    oldColor = icon[1];
                    oldIcon = icon[2];
                    oldLibrary = icon[3] || "fa";
                }
                switch(type){
                    case "color":
                        ctrl.hasChanges.color = (oldColor !== changes);
                        break;
                    case "icon":
                        ctrl.hasChanges.icon = (oldIcon !== changes.key) || (oldLibrary !== changes.library);
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
                        break;
                    case "scriptUri":
                        ctrl.hasChanges.scriptUri = (ctrl.session.gameModel.properties.scriptUri !==  changes);
                        break;
                    case "clientScriptUri":
                        ctrl.hasChanges.clientScriptUri = (ctrl.session.gameModel.properties.clientScriptUri !==  changes);
                        break;
                    case "cssUri":
                        ctrl.hasChanges.cssUri = (ctrl.session.gameModel.properties.cssUri !==  changes);
                        break;
                    case "pages":
                        ctrl.hasChanges.pagesUri = (ctrl.session.gameModel.properties.pagesUri !==  changes);
                        break;
                    case "logID":
                        ctrl.hasChanges.logID = (ctrl.session.gameModel.properties.logID !==  changes);
                        break;
                }
                ctrl.hasChanges.all =   ctrl.hasChanges.color || ctrl.hasChanges.icon || ctrl.hasChanges.name 
                                        || ctrl.hasChanges.token || ctrl.hasChanges.comments || ctrl.hasChanges.individual
                                        || ctrl.hasChanges.scriptUri || ctrl.hasChanges.clientScriptUri || ctrl.hasChanges.cssUri 
                                        || ctrl.hasChanges.pagesUri || ctrl.hasChanges.logID;
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
        ctrl.changeIcon = function(iconKey, iconLib) {
            ctrl.infos.icon = {
                key:iconKey,
                library:iconLib
            };
            ctrl.checkChanges("icon", ctrl.infos.icon);
        }

        ctrl.save = function() {
            SessionsModel.updateSession(ctrl.session, ctrl.infos).then(function(response){
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

        $scope.$watch(function(){
            return ctrl.infos.logID;
        }, function(newLogID){
            ctrl.checkChanges("logID", newLogID);
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
    .directive('trainerSessionsCustomizeAdvanced', function() {
        return {
            scope:{
                activeInfos: "="
            },
            templateUrl: 'app/private/trainer/settings/directives.tmpl/infos-advanced.html'
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