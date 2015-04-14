angular.module('private.trainer.sessions.customize.directives', [
    'wegas.service.customize'
])
    .directive('trainerSessionsCustomizeIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/sessions/customize/directives.tmpl/index.html',
            controller: "TrainerSessionsCustomizeIndexController as customizeIndexCtrl"
        };
    }).controller("TrainerSessionsCustomizeIndexController", function TrainerSessionsCustomizeIndexController($rootScope, $scope, $stateParams, SessionsModel, Flash) {
        var ctrl = this,
            initTabs = function() {
                return {
                    infos: false,
                    icons: false,
                    colors: false
                }
            };
        ctrl.session = {};
        ctrl.infos = {
            name : "",
            token : "", 
            comments :"",
            color: "orange",
            icon:"gamepad"
        }
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
                }
            });
        };

        ctrl.activeTab = function(tab) {
            ctrl.tabs = initTabs();
            ctrl.tabs[tab] = true;
        }

        ctrl.changeColor = function(newColor) {
            ctrl.infos.color = newColor;
        }
        ctrl.changeIcon = function(newIcon) {
            ctrl.infos.icon = newIcon;
        }

        ctrl.save = function() {
            SessionsModel.updateSession(ctrl.session.id, ctrl.infos).then(function(response){
                response.flash();
                if(!response.isErroneous()){
                    $rootScope.$emit("changeSessions", true);
                    $scope.close();
                }
            });
        };

        ctrl.cancel = function(){
            $scope.close();
        };

        ctrl.updateSession();
        ctrl.activeTab("infos");
    })
    .directive('trainerSessionsCustomizeInfos', function() {
        return {
            scope:{
                activeInfos: "="
            },
            templateUrl: 'app/private/trainer/sessions/customize/directives.tmpl/infos-form.html'

        }
    })
    .directive('trainerSessionsCustomizeIcons', function(Customize) {
        return {
            templateUrl: 'app/private/trainer/sessions/customize/directives.tmpl/icons-picker.html',
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
            templateUrl: 'app/private/trainer/sessions/customize/directives.tmpl/colors-picker.html',
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