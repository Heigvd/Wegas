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
    }).controller("TrainerSessionsCustomizeIndexController", function TrainerSessionsCustomizeIndexController($scope, $stateParams, SessionsModel, Flash) {
        var ctrl = this,
            initTabs = function() {
                return {
                    infos: false,
                    icons: false,
                    colors: false
                }
            }
        ctrl.session = {};
        ctrl.color = "orange";
        ctrl.icon = "gamepad";
        ctrl.tabs = initTabs();
            

        ctrl.updateSession = function() {
            SessionsModel.getSession("managed", $stateParams.id, true).then(function(response) {
                ctrl.session = response.data || {};
                var infos = ctrl.session.properties.iconUri.split("_");
                if (response.isErroneous()) {
                    response.flash();
                }else{
                    if (infos.length == 3 && infos[0] == "ICON") {
                        ctrl.color = infos[1];
                        ctrl.icon = infos[2];
                    }
                }
            });
        };

        ctrl.activeTab = function(tab) {
            ctrl.tabs = initTabs();
            ctrl.tabs[tab] = true;
        }

        ctrl.changeColor = function(newColor) {
            ctrl.color = newColor;
        }
        ctrl.changeIcon = function(newIcon) {
            console.log("Hello");
            ctrl.icon = newIcon;
        }

        ctrl.save = function() {
            if(ctrl.session.properties.iconUri !== ("ICON_" + ctrl.color + "_" + ctrl.icon)){
                ctrl.session.properties.iconUri = "ICON_" + ctrl.color + "_" + ctrl.icon;
                SessionsModel.updateIconSession(ctrl.session).then(function(response){
                    response.flash();
                    $scope.close();
                });
            }else{
                Flash.info("The session hasn't changed");
            }
        };

        ctrl.cancel = function() {
            $scope.close();
        };

        ctrl.updateSession();
        ctrl.activeTab("infos");
    })
    .directive('trainerSessionsCustomizeInfos', function() {
        return {
            templateUrl: 'app/private/trainer/sessions/customize/directives.tmpl/infos-form.html',
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
    });