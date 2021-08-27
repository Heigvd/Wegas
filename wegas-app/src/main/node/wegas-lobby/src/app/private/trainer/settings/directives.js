angular.module('private.trainer.settings.directives', [
    'wegas.service.customize'
])
    .directive('trainerSessionsSettingsIndex', function() {
        "use strict";
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/settings/directives.tmpl/index.html',
            controller: "TrainerSettingsIndexController as settingsIndexCtrl"
        };
    })
    .controller("TrainerSettingsIndexController", function TrainerSettingsIndexController($rootScope, $scope, $location, $state, $stateParams, SessionsModel, Flash) {
        "use strict";
        var ctrl = this,
            initTabs = function() {
                return {
                    infos: false,
                    advanced: false
                };
            };
        ctrl.session = {};
        ctrl.hasChanges = {
            all: false,
            name: false,
            comment: false,
            token: false,
            individual: false,
            scriptUri: false,
            clientScriptUri: false,
            cssUri: false,
            pagesUri: false,
            logID: false,
            guestAllowed: false,
            languages: false
        };
        ctrl.infos = {
            baseUrl: $location.protocol() + "://" + location.host + location.pathname,
            name: "",
            token: "",
            comments: "",
            color: "orange",
            icon: {
                key: "gamepad",
                library: 'fa'
            },
            scenario: "",
            individual: false,
            scriptUri: "",
            clientScriptUri: "",
            cssUri: "",
            pagesUri: "",
            logID: "",
            guestAllowed: false,
            languages: []
        };
        ctrl.tabs = initTabs();

        ctrl.kindsOfSession = ($state.$current.name === "wegas.private.trainer.settings") ? "LIVE" : "BIN";

        ctrl.updateSession = function() {
            SessionsModel.getSession(ctrl.kindsOfSession, $stateParams.id, true).then(function(response) {
                ctrl.session = response.data || {};
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    var icon = ctrl.session.properties.iconUri.split("_");
                    if (icon.length >= 3 && icon[0] === "ICON") {
                        ctrl.infos.color = icon[1];
                        ctrl.infos.icon.key = icon[2];
                        if (icon[3]) {
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
                    ctrl.infos.guestAllowed = ctrl.session.gameModel.properties.guestAllowed;
                    ctrl.infos.languages = [];
                    for (var i = 0; i < ctrl.session.gameModel.languages.length; i++) {
                        ctrl.infos.languages.push(JSON.parse(JSON.stringify(ctrl.session.gameModel.languages[i])));
                    }
                }
            });
        };

        ctrl.checkChanges = function(type, changes) {
            if (ctrl.session['@class'] === "Game") {
                switch (type) {
                    case "name":
                        ctrl.hasChanges.name = (ctrl.session.name !== changes);
                        break;
                    case "token":
                        ctrl.hasChanges.token = (ctrl.session.token !== changes);
                        break;
                    case "comments":
                        ctrl.hasChanges.comments = (ctrl.session.gameModel.comments !== changes);
                        break;
                    case "individual":
                        ctrl.hasChanges.individual = (ctrl.session.properties.freeForAll !== changes);
                        break;
                    case "scriptUri":
                        ctrl.hasChanges.scriptUri = (ctrl.session.gameModel.properties.scriptUri !== changes);
                        break;
                    case "clientScriptUri":
                        ctrl.hasChanges.clientScriptUri = (ctrl.session.gameModel.properties.clientScriptUri !== changes);
                        break;
                    case "cssUri":
                        ctrl.hasChanges.cssUri = (ctrl.session.gameModel.properties.cssUri !== changes);
                        break;
                    case "pages":
                        ctrl.hasChanges.pagesUri = (ctrl.session.gameModel.properties.pagesUri !== changes);
                        break;
                    case "logID":
                        ctrl.hasChanges.logID = (ctrl.session.gameModel.properties.logID !== changes);
                        break;
                    case "guestAllowed":
                        ctrl.hasChanges.guestAllowed = (ctrl.session.gameModel.properties.guestAllowed !== changes);
                        break;
                }
                ctrl.hasChanges.all = ctrl.hasChanges.name ||
                    ctrl.hasChanges.token || ctrl.hasChanges.comments || ctrl.hasChanges.individual ||
                    ctrl.hasChanges.scriptUri || ctrl.hasChanges.clientScriptUri || ctrl.hasChanges.cssUri ||
                    ctrl.hasChanges.pagesUri || ctrl.hasChanges.logID || ctrl.hasChanges.guestAllowed;
            }
        };

        ctrl.activeTab = function(tab) {
            ctrl.tabs = initTabs();
            ctrl.tabs[tab] = true;
        };

        ctrl.save = function() {
            SessionsModel.updateSession(ctrl.session, ctrl.infos).then(function(response) {
                if (!response.isErroneous()) {
                    // @hack: update input field in parent listing
                    $('#token-' + ctrl.session.id).removeClass("token-error");
                    $rootScope.$emit("changeSessions", true);
                    $scope.close();
                } else {
                    response.flash();
                }
            });
        };
        ctrl.generateQrCode = function() {
            var node = document.querySelector(".advanced .qrcode_link .qrcode_thumbnail");
            var link = document.querySelector(".advanced .qrcode_link a");
            var url = ctrl.infos.baseUrl + "#/play/" + ctrl.infos.token;
            if (node) {
                if (ctrl.qrCode) {
                    ctrl.qrCode.clear();
                    ctrl.qrCode.makeCode(url);
                } else {
                    ctrl.qrCode = new QRCode(node, url);
                }
                link.removeEventListener("click", ctrl._onClick);
                link.addEventListener("click", ctrl._onClick);
            }
        };

        ctrl._onClick = function() {
            var w = window.open('about:blank');
            setTimeout(function() { //FireFox seems to require a setTimeout for this to work.
                var img = document.querySelector(".advanced .qrcode_link .qrcode_thumbnail img");
                var newImg = w.document.createElement('img');
                w.document.body.appendChild(newImg);
                newImg.src = img.src;
                newImg.title = img.title;
            }, 0);
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

        ctrl.updateSession();
        ctrl.activeTab("infos");
    })
    .directive('trainerSessionsCustomizeInfos', function() {
        "use strict";
        return {
            scope: {
                activeInfos: "="
            },
            templateUrl: 'app/private/trainer/settings/directives.tmpl/infos-form.html',
            link: function(scope, elem, attrs) {
                $(".link--selector").on("click", function(e) {
                    e.stopPropagation();
                    $(".tool--selectable").trigger("click");
                });
            }
        };
    })
    .directive('trainerSessionsCustomizeLanguages', function(Auth) {
        "use strict";
        return {
            scope: {
                activeInfos: "="
            },
            templateUrl: 'app/private/trainer/settings/directives.tmpl/languages.html',
            link: function(scope, elem, attrs) {
                Auth.getAuthenticatedUser().then(function(user) {
                    scope.user = user;
                });
                $(".link--selector").on("click", function(e) {
                    e.stopPropagation();
                    $(".tool--selectable").trigger("click");
                });
            }
        }
    })
    .directive('trainerSessionsCustomizeAdvanced', function(Auth) {
        "use strict";
        return {
            scope: {
                activeInfos: "=",
            },
            templateUrl: 'app/private/trainer/settings/directives.tmpl/infos-advanced.html',
            controller: "TrainerSettingsIndexController as settingsIndexCtrl",
            link: function(scope, elem, attrs) {
                Auth.getAuthenticatedUser().then(function(user) {
                    scope.user = user;
                });
                $(".link--selector").on("click", function(e) {
                    e.stopPropagation();
                    $(".tool--selectable").trigger("click");
                });
            }
        }
    });

