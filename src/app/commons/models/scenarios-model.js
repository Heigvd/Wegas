'use strict';
angular.module('wegas.models.scenarios', [])
  .controller('tutu', function() {

    var scenario = ScenariosModel.findScenario(123);
    PermissionModel.scenarioId = scenario.id;
    scope.permissions = PermissionModel.getPermissions();

  })
  .service('PermissionModel', function($http, $q) {
    var model = this;

    model.getPermissionsFor = function(scenarioId) {
      // Todo
    }

    model.updatePermissions = function(scenarioId, userId, canCreate, canDuplicate, canEdit) {

      var deferred = $q.defer();
      // Removing all permission
      this.deletePermissions(scenarioId, userId).then(function(result) {
        // Remove works ?
        if (result === true) {
          // Calculating new permission as wegas see them
          var permissions = "";
          if (canEdit) {
            permissions = "View,Edit,Delete,Duplicate,Instantiate";
          } else {
            if (canCreate && canDuplicate) {
              permissions = "Instantiate,Duplicate";
            } else if (canCreate) {
              permissions = "Instantiate";
            } else if (canDuplicate) {
              permissions = "Duplicate";
            } else {
              // No permissions means ok.
              deferred.resolve(true);
            }
          }

          var url = "rest/Extended/User/addAccountPermission/" +
            "GameModel:" + permissions + ":gm" + scenarioId + "/" + userId;
          // Updating permissions
          $http
            .post(ServiceURL + url, null, {
              "headers": {
                "managed-mode": "true"
              }
            })
            .success(function(data) {

              deferred.resolve(true);
            }).error(function(data) {

              deferred.resolve(data);
            });
        } else {
          deferred.resolve(result);
        }
      });
      return deferred.promise;
    }

    model.deletePermissions = function(scenarioId, userId) {
      var deferred = $q.defer();

      var url = "rest/Extended/User/DeleteAccountPermissionByInstanceAndAccount/gm" + scenarioId + "/" + userId;

      $http
        .delete(ServiceURL + url, {
          "headers": {
            "managed-mode": "true"
          }
        })
        .success(function(data) {
          deferred.resolve(true);
        }).error(function(data) {
          deferred.resolve(data);
        });
      return deferred.promise;
    }
  })
  .service('ScenariosModel', function($http, $q, PermissionModel) {
    var model = this,
      scenarios = null;


    function findScenario(scenarios, id) {
      return _.find(scenarios, function(s) {
        return s.id == id;
      });
    }

    function applyIcon(data) {
      var defaultIcon = {
        color: "orange",
        name: "gamepad"
      };
      data.forEach(function(scenario) {
        var iconInfos = scenario.properties.iconUri;
        if (iconInfos == null || iconInfos == "") {
          scenario.icon = defaultIcon;
        } else {
          var infos = iconInfos.split("_");
          if (infos.length == 3 && infos[0] == "ICON") {
            scenario.icon = {
              color: infos[1],
              name: infos[2]
            };

          } else {
            scenario.icon = defaultIcon;
          }
        }
      });
      return data
    }

    model.createScenario = function(name, templateId) {
      var deferred = $q.defer();

      $http.post(ServiceURL + "rest/Public/GameModel/" + templateId, {
        "@class": "GameModel",
        "templateId": templateId,
        "name": name,
        "properties": {}
      }).success(function(data) {
        deferred.resolve(applyIcon([data])[0]);
      }).error(function(data) {
        deferred.resolve(data);
      });
      return deferred.promise;
    }

    model.updateScenario = function(scenario) {
      var deferred = $q.defer();

      $http.post(ServiceURL + "rest/Public/GameModel/" + scenario.id, {
        "@class": "GameModel",
        "id": scenario.id,
        "name": scenario.name,
        "comments": scenario.comments
      }).success(function(data) {
        deferred.resolve(applyIcon([data])[0]);
      }).error(function(data) {
        deferred.resolve(data);
      });

      return deferred.promise;
    }

    model.deletePermissions = function(scenarioId, userId) {
      return PermissionModel.deletePermissions(scenarioId, userId);
    }
    model.updatePermissions = function(scenarioId, userId, canCreate, canDuplicate, canEdit) {
      return PermissionModel.updatePermissions(scenarioId, userId, canCreate, canDuplicate, canEdit);
    }

    model.getScenarios = function() {


      var deferred = $q.defer();
      if (scenarios !== null) {

        deferred.resolve(scenarios);
      } else {
        scenarios = [];
        $http.get(ServiceURL + "rest/Public/GameModel/?view=EditorExtended").success(function(data) {

          scenarios = applyIcon(data);
          deferred.resolve(scenarios);
        }).error(function(data) {
          // scenarios = [];
          // deferred.resolve([]);
          data = [{
            "@class": "GameModel",
            "name": " Eye Test DemoNonReduit_exemple",
            "createdTime": 1416850310140,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 6656,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": " Eye Test Demo_Reduitexemple",
            "createdTime": 1421686629143,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 7055,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "9Cases_test",
            "createdTime": 1395754515046,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-teaching/js/wegas-teaching-loader.js"
            },
            "createdByName": "Nicolas Frei",
            "id": 2957,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "CEP Game",
            "createdTime": 1390587805484,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-leaderway/images/leaderway-thumb.png",
              "iconUri": "wegas-leaderway/images/leaderway-icon.png",
              "pagesUri": "wegas-cep/db/wegas-cep-pages.json#",
              "cssUri": "wegas-cep/css/wegas-cep.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-leaderway/js/wegas-leaderway-loader.js"
            },
            "createdByName": "Pierre Jacot",
            "id": 2505,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "CEP Game 2015",
            "createdTime": 1422627956039,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-leaderway/images/leaderway-thumb.png",
              "iconUri": "wegas-leaderway/images/leaderway-icon.png",
              "pagesUri": "wegas-cep/db/wegas-cep-pages.json#",
              "cssUri": "wegas-cep/css/wegas-cep.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-leaderway/js/wegas-leaderway-loader.js"
            },
            "createdByName": "Pierre Jacot",
            "id": 7308,
            "description": "",
            "comments": "Revue Dominique: \nRevue prestation-processus:\n- questions: ok\n- actions: ok\nEvaluation processus:\n- questions bonnes activitÃ©s, partage ressources: ok",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "CEP Game 2015 - sauvegarde 1Ã¨re version Pierre",
            "createdTime": 1426231451751,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-leaderway/images/leaderway-thumb.png",
              "iconUri": "wegas-leaderway/images/leaderway-icon.png",
              "pagesUri": "wegas-cep/db/wegas-cep-pages.json#",
              "cssUri": "wegas-cep/css/wegas-cep.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-leaderway/js/wegas-leaderway-loader.js"
            },
            "createdByName": "dom scen",
            "id": 7953,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "CEP Game backup 29 mars",
            "createdTime": 1396026193746,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-leaderway/images/leaderway-thumb.png",
              "iconUri": "wegas-leaderway/images/leaderway-icon.png",
              "pagesUri": "wegas-cep/db/wegas-cep-pages.json#",
              "cssUri": "wegas-cep/css/wegas-cep.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-leaderway/js/wegas-leaderway-loader.js"
            },
            "createdByName": "Pierre Jacot",
            "id": 3054,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Chess",
            "createdTime": 1374042957345,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "732a1df75d93d028e4f9",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Admin  ",
            "id": 1351,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "CrimeSim (v.2)",
            "createdTime": 1395046254672,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-crimesim/images/crimesim-thumb.png",
              "iconUri": "wegas-crimesim/images/crimesim-icon.png",
              "pagesUri": "wegas-crimesim/db/wegas-crimesim-pages.json#",
              "cssUri": "wegas-crimesim/css/wegas-crimesim.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-crimesim/js/wegas-crimesim-loader.js"
            },
            "createdByName": "Oli DelÃ©mont",
            "id": 2770,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "CrimeSim (v.3)",
            "createdTime": 1395673487558,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-crimesim/images/crimesim-thumb.png",
              "iconUri": "wegas-crimesim/images/crimesim-icon.png",
              "pagesUri": "wegas-crimesim/db/wegas-crimesim-pages.json#",
              "cssUri": "wegas-crimesim/css/wegas-crimesim.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-crimesim/js/wegas-crimesim-loader.js"
            },
            "createdByName": "Admin  ",
            "id": 2913,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "CrimeSim_v1",
            "createdTime": 1370256320679,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-crimesim/images/crimesim-thumb.png",
              "iconUri": "wegas-crimesim/images/crimesim-icon.png",
              "pagesUri": "wegas-crimesim/db/wegas-crimesim-pages.json#",
              "cssUri": "wegas-crimesim/css/wegas-crimesim.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-crimesim/js/wegas-crimesim-loader.js"
            },
            "createdByName": "Admin  ",
            "id": 602,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "CrimeSim_v1_TestDom2",
            "createdTime": 1370256320679,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-crimesim/images/crimesim-thumb.png",
              "iconUri": "wegas-crimesim/images/crimesim-icon.png",
              "pagesUri": "wegas-crimesim/db/wegas-crimesim-pages.json#",
              "cssUri": "wegas-crimesim/css/wegas-crimesim.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-crimesim/js/wegas-crimesim-loader.js"
            },
            "createdByName": "dominique jaccard",
            "id": 1601,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Def_FlexiTests_Eye_test(1)Fulvio",
            "createdTime": 1395917643382,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 3002,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "DemoDidac",
            "createdTime": 1416919210359,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": null,
            "id": 6657,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "DomBaseJeu: 0-vide",
            "createdTime": 1367909963445,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "dominique jaccard",
            "id": 1452,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "DomBaseJeu: 1 qques variables",
            "createdTime": 1367909963445,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "dominique jaccard",
            "id": 1604,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "DomBaseJeu: 2 base main page",
            "createdTime": 1367909963445,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "dominique jaccard",
            "id": 1605,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "DomPatient - pour tests",
            "createdTime": 1393321567354,
            "properties": {
              "freeForAll": false,
              "imageUri": "/Thumbpatient.png",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dominique jaccard",
            "id": 2701,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "DomTest",
            "createdTime": 1367909963445,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "dominique jaccard",
            "id": 2251,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Droit",
            "createdTime": 1422449202113,
            "properties": {
              "freeForAll": false,
              "imageUri": "/croppedimage300300-balance.jpg",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Maxence Laurent",
            "id": 7251,
            "description": "",
            "comments": "original",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Droit(2)",
            "createdTime": 1422621654082,
            "properties": {
              "freeForAll": false,
              "imageUri": "/croppedimage300300-balance.jpg",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Rita  Trigo Trindade",
            "id": 7304,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Empty PMG",
            "createdTime": 1413199619989,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Maxence Laurent",
            "id": 6201,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Entretien",
            "createdTime": 1416924504067,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Girardet Khedidja",
            "id": 6674,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Essai EC",
            "createdTime": 1419699292083,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-lobby/images/wegas-virtualpatient-thumb.png",
              "iconUri": "/Icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": null,
            "id": 7002,
            "description": "<p>Simple demo of how Wegas may be used for&nbsp;health care education</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "EvalCliniqueCardiaque",
            "createdTime": 1412342009498,
            "properties": {
              "freeForAll": true,
              "imageUri": "/we-club-mon-chomdu-photo4.jpg",
              "iconUri": "/we-club-mon-chomdu-photo4.jpg",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dom scen",
            "id": 6055,
            "description": "<p>La Source</p>",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiDemo",
            "createdTime": 1370256320679,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Cyril Junod",
            "id": 1352,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests",
            "createdTime": 1370256320679,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Cyril Junod",
            "id": 1151,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests - Bias hunter",
            "createdTime": 1402062625004,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Admin  ",
            "id": 4153,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests Eye Test Demo",
            "createdTime": 1415279658914,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Cyril Junod",
            "id": 6451,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests-Hunter",
            "createdTime": 1402061185545,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Cyril Junod",
            "id": 4151,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_13decembre_MemoireEtDeveloppement",
            "createdTime": 1418484155714,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Alexia Steiger",
            "id": 6864,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_13decembre_MemoireEtDeveloppementCopie",
            "createdTime": 1418487588491,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Alexia Steiger",
            "id": 6868,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_13decembre_MemoireEtDeveloppementCopieSecour",
            "createdTime": 1418486342537,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Alexia Steiger",
            "id": 6866,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_13decembre_MemoireEtDeveloppementModif",
            "createdTime": 1418486328849,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Alexia Steiger",
            "id": 6865,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_13decembre_MemoireEtDeveloppementModif(2)",
            "createdTime": 1419858560471,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Alexia Steiger",
            "id": 7003,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_13decembre_MemoireEtDeveloppementModif(2)(2)",
            "createdTime": 1420198094350,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Alexia Steiger",
            "id": 7005,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_13decembre_MemoireEtDeveloppementModif(2)(2)(2)",
            "createdTime": 1420198105667,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Alexia Steiger",
            "id": 7006,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_27novembre_Memoire",
            "createdTime": 1416740963963,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Alexia Steiger",
            "id": 6652,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_4octobre_plus_difficile",
            "createdTime": 1370256320679,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Cyril Junod",
            "id": 2101,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_Biais_attentionnel",
            "createdTime": 1392917698507,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 2628,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_Biais_attentionnel(1)",
            "createdTime": 1393516516977,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Pandazis",
            "id": 2751,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_Biais_attentionnel(1)(1)",
            "createdTime": 1396429702235,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Karli Bettina",
            "id": 3102,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_Biais_attentionnel_POSITIF",
            "createdTime": 1397413689857,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 3454,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_Eye_test(1)",
            "createdTime": 1394828156574,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 2768,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_Eye_test(1)(1)",
            "createdTime": 1403861874616,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 4501,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_Source_Monitoring_HEUREUX",
            "createdTime": 1395930270370,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Elvis Coimbra Gomes",
            "id": 3007,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_Source_Monitoring_TRISTE",
            "createdTime": 1392917561535,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 2627,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_truth little trashB",
            "createdTime": 1395585693412,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Milana Aronov",
            "id": 2906,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FlexiTests_truth middle trashA",
            "createdTime": 1395329470862,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "ChloÃ© Miserez",
            "id": 2855,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "FormationMixte",
            "createdTime": 1400849547049,
            "properties": {
              "freeForAll": false,
              "imageUri": "/FormationMixte.png",
              "iconUri": "/FormationMixte.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Jacques DELMAS",
            "id": 3952,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Gouveole",
            "createdTime": 1416919644426,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Florent Joerin",
            "id": 6660,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Jeu de Berny",
            "createdTime": 1418399922507,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-lobby/images/wegas-virtualpatient-thumb.png",
              "iconUri": "/Icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": null,
            "id": 6859,
            "description": "<p>Simple demo of how Wegas may be used for&nbsp;health care education</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "KickStarter",
            "createdTime": 1416919736480,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Vincenzo Pallotta",
            "id": 6662,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Kitaro",
            "createdTime": 1424245072220,
            "properties": {
              "freeForAll": false,
              "imageUri": "/bonAnni.png",
              "iconUri": "/bonAnniIcon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Maxence Laurent",
            "id": 7701,
            "description": "",
            "comments": "original",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "La sÃ©curitÃ© lors d'installations Ã©lectriques - TB",
            "createdTime": 1403081049807,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Guillaume Lehmann",
            "id": 4301,
            "description": "<p>Serious Game de sensibilisation &agrave; la s&eacute;curit&eacute; lors d'installations &eacute;lectriques</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "La sÃ©curitÃ© lors d'installations Ã©lectriques - TB Backup 11.08.2014",
            "createdTime": 1407731300957,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Guillaume Lehmann",
            "id": 4909,
            "description": "<p>Serious Game de sensibilisation &agrave; la s&eacute;curit&eacute; lors d'installations &eacute;lectriques</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "La sÃ©curitÃ© Ã©lectrique Backcup 27.07.2014",
            "createdTime": 1406422099675,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Guillaume Lehmann",
            "id": 4751,
            "description": "<p>Serious Game de sensibilisation &agrave; la s&eacute;curit&eacute; lors d'installations &eacute;lectriques</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "La sÃ©curitÃ© Ã©lectrique Backup 04.08.2014",
            "createdTime": 1407184333064,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Guillaume Lehmann",
            "id": 4801,
            "description": "<p>Serious Game de sensibilisation &agrave; la s&eacute;curit&eacute; lors d'installations &eacute;lectriques</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "La sÃ©curitÃ© Ã©lectrique yannick",
            "createdTime": 1404813645621,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": null
            },
            "createdByName": "yannick Lagger",
            "id": 4567,
            "description": "<p>Serious Game de sensibilisation &agrave; la s&eacute;curit&eacute; lors d'installations &eacute;lectriques</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Lagger",
            "createdTime": 1404810516374,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "yannick Lagger",
            "id": 4566,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Le livre dont vous Ãªtes le hÃ©ros",
            "createdTime": 1370256320679,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "wegas-book/db/wegas-book-pages.json#",
              "cssUri": "wegas-book/css/wegas-book.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Admin  ",
            "id": 252,
            "description": null,
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Leaderway",
            "createdTime": 1399902439253,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-leaderway/images/leaderway-thumb.png",
              "iconUri": "wegas-leaderway/images/leaderway-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-leaderway/js/wegas-leaderway-loader.js"
            },
            "createdByName": "dom scen",
            "id": 3757,
            "description": "<p>Lead a team and manage its members expectations.</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Les 9 cases",
            "createdTime": 1410529459664,
            "properties": {
              "freeForAll": false,
              "imageUri": "/Thumb_9cases.png",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-teaching/js/wegas-teaching-loader.js"
            },
            "createdByName": "Francois-Xavier  ",
            "id": 5752,
            "description": "<p>This game demonstrates how Wegas can be used to create e-learning activities.</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Les 9 cases - ExÃ©cution",
            "createdTime": 1382532439573,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-teaching/js/wegas-teaching-loader.js"
            },
            "createdByName": "Admin  ",
            "id": 2102,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Les 9 cases - Planification",
            "createdTime": 1382532439573,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-teaching/js/wegas-teaching-loader.js"
            },
            "createdByName": "Admin  ",
            "id": 1852,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Les 9 cases - RÃ©alisation",
            "createdTime": 1417089917448,
            "properties": {
              "freeForAll": false,
              "imageUri": "/Thumb_9cases.png",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-teaching/js/wegas-teaching-loader.js"
            },
            "createdByName": "Francois-Xavier  ",
            "id": 6704,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Les 9 cases - test",
            "createdTime": 1397633415569,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-teaching/js/wegas-teaching-loader.js"
            },
            "createdByName": "Leyun Xia",
            "id": 3458,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Manager",
            "createdTime": 1396278773399,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Bastien Schulz",
            "id": 3101,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Moti's test game",
            "createdTime": 1396615433830,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Timo Schuler",
            "id": 3254,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "MultiplayerQuestionsTest_v1",
            "createdTime": 1416235109208,
            "properties": {
              "freeForAll": false,
              "imageUri": "/01icon.jpg",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Fabrice Clerc",
            "id": 6554,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "MÃ©decine nuclÃ©aire",
            "createdTime": 1425931263418,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Sautier Olivia",
            "id": 7902,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "OlÃ©",
            "createdTime": 1418399405779,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": null,
            "id": 6858,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG - DemoGame",
            "createdTime": 1411734860528,
            "properties": {
              "freeForAll": true,
              "imageUri": "/PMG-Demo.png",
              "iconUri": "/PMG-Demo.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "dominique jaccard",
            "id": 6001,
            "description": "<p>Initiate and lead your project.</p>",
            "comments": "Pour dÃ©mo sur site web, en accÃ¨s libre.\nQuestions avec rÃ©ponses tronquÃ©es.\nAvancement limitÃ© Ã  la pÃ©riode 3 de rÃ©alisation dans Trigger dans private",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG Artos",
            "createdTime": 1410356447274,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Maxence Laurent",
            "id": 5601,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG Artos - English",
            "createdTime": 1412242129516,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "dom scen",
            "id": 6054,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG Belleville",
            "createdTime": 1410424224209,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Christopher de Guzman",
            "id": 5651,
            "description": "",
            "comments": "sur la base de Belleville Dom 1.3",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG Belleville(2)",
            "createdTime": 1423088508595,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Maxence Laurent",
            "id": 7353,
            "description": "",
            "comments": "sur la base de Belleville Dom 1.3",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG H&M",
            "createdTime": 1413212335528,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Maxence Laurent",
            "id": 6204,
            "description": "<p>Ce cas traite du groupe su&eacute;dois Hennes &amp; Mauritz (H&amp;M), second g&eacute;ant de la mode en Europe. En expansion continuelle, H&amp;M a comme projet d&rsquo;ouvrir la vente sur Internet de ses collections aux Etats-Unis. Vous avez &eacute;t&eacute; nomm&eacute; chef de projet et &ecirc;tes donc responsable du bon d&eacute;roulement de ce projet, bonne chance !</p>\n<p>&nbsp;</p>\n<p>*Ce projet tir&eacute; de la r&eacute;alit&eacute; a &eacute;t&eacute; adapt&eacute; &agrave; des fins d&rsquo;enseignement.</p>\n<p>&nbsp;</p>\n<p>&nbsp;</p>",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG Losvaxis",
            "createdTime": 1413212216165,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Maxence Laurent",
            "id": 6202,
            "description": "<p>Import Losvaxis initial</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG Losvaxis (Sauvegarde 23-01-15)",
            "createdTime": 1422025265120,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "RaphaÃ«l Schmutz",
            "id": 7201,
            "description": "<p>Import Losvaxis initial</p>",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG ManagEnergy",
            "createdTime": 1413212373723,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Maxence Laurent",
            "id": 6205,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG NPO-Sandelman",
            "createdTime": 1413212262640,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Maxence Laurent",
            "id": 6203,
            "description": "<p>NPO-Sandelman import initial</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PMG NPO-Sandelman (restored)",
            "createdTime": 1418289570662,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Maxence Laurent",
            "id": 6854,
            "description": "<p>NPO-Sandelman import initial</p>",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PdfExportTest Ð’ÐµÐ³Ð°Ñ ",
            "createdTime": 1405590911317,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Maxence Laurent",
            "id": 4651,
            "description": "<p>&uuml;berSch&ouml;n</p>\n<p>&nbsp;</p>\n<p>Ð’ÐµÐ³Ð°Ñ</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "PdfExportTest Ð’ÐµÐ³Ð°Ñ (2)",
            "createdTime": 1417015937912,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Maxence Laurent",
            "id": 6682,
            "description": "<p>&uuml;berSch&ouml;n</p>\n<p>&nbsp;</p>\n<p>Ð’ÐµÐ³Ð°Ñ</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Prog game",
            "createdTime": 1404897657766,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-proggame/images/proggame-thumb-1.png",
              "iconUri": "wegas-proggame/images/proggame-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-proggame/css/wegas-proggame.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-proggame/js/wegas-proggame-loader.js"
            },
            "createdByName": "Valentin Defferrard",
            "id": 4577,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Programming Game",
            "createdTime": 1401285365984,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-proggame/images/proggame-thumb-1.png",
              "iconUri": "wegas-proggame/images/proggame-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-proggame/css/wegas-proggame.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-proggame/js/wegas-proggame-loader.js"
            },
            "createdByName": "Admin  ",
            "id": 2000,
            "description": "<p>Learn Javascript by coding your way through the game.</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Programming game-0.1-Fin projet cyberlearn",
            "createdTime": 1400836831777,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-proggame/images/proggame-thumb-1.png",
              "iconUri": "wegas-proggame/images/proggame-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-proggame/css/wegas-proggame.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-proggame/js/wegas-proggame-loader.js"
            },
            "createdByName": "Admin  ",
            "id": 3951,
            "description": "Version finale Cyberlearn.\nMars 2014",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Prototype 1",
            "createdTime": 1401316105536,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Guillaume Lehmann",
            "id": 4002,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Prototype 2",
            "createdTime": 1401584959537,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Guillaume Lehmann",
            "id": 4004,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "RES JFE",
            "createdTime": 1416920160561,
            "properties": {
              "freeForAll": false,
              "imageUri": "/Lighthouse.jpg",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "EQUEY Jean-FranÃ§ois",
            "id": 6665,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "RSE Khedi",
            "createdTime": 1416920162713,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Girardet Khedidja",
            "id": 6667,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "RSE Sonia",
            "createdTime": 1416920172709,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Sonia Perrotte",
            "id": 6668,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "RSE_Milena",
            "createdTime": 1416920151527,
            "properties": {
              "freeForAll": false,
              "imageUri": "/RSE.jpg",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Milena Properzi",
            "id": 6664,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "RSE_RedOne",
            "createdTime": 1416920160631,
            "properties": {
              "freeForAll": false,
              "imageUri": "/lOGO-redONE.png",
              "iconUri": "/redONE-500x500.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Boumaref Redouane",
            "id": 6666,
            "description": "<p>Responsabilit&eacute; soci&eacute;tale d'entreprise</p>",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "RSZ_Empty",
            "createdTime": 1423661409662,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "RaphaÃ«l Schmutz",
            "id": 7501,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Radiosievert",
            "createdTime": 1416919645200,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Sautier Olivia",
            "id": 6661,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Radiosievert-JMS",
            "createdTime": 1416986925612,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Jean-Marc Seydoux",
            "id": 6679,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Sample game",
            "createdTime": 1393289609699,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Admin  ",
            "id": 2653,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "ScÃ©narios Test AD",
            "createdTime": 1396611011822,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Adrien Duvoisin",
            "id": 3251,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "SimpleDialogue",
            "createdTime": 1385202729236,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "wegas-simpledialogue/db/wegas-simpledialogue-pages.json?",
              "cssUri": "wegas-simpledialogue/css/wegas-simpledialogue.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Anthony  Geiser",
            "id": 2051,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "TEST",
            "createdTime": 1401372863977,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Leslie HUIN",
            "id": 4003,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "TEST2",
            "createdTime": 1417002878099,
            "properties": {
              "freeForAll": false,
              "imageUri": "/Thumb_9cases.png",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-teaching/js/wegas-teaching-loader.js"
            },
            "createdByName": "Arnould RÃ©mi",
            "id": 6680,
            "description": "<p>This game demonstrates how Wegas can be used to create e-learning activities.</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "TEST_Calcul1",
            "createdTime": 1416919589181,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Arnould RÃ©mi",
            "id": 6659,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Test",
            "createdTime": 1403864894571,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Nicolas Regamey",
            "id": 4503,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Test",
            "createdTime": 1416919282728,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": null,
            "id": 6658,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Test X",
            "createdTime": 1399030838035,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-pmg/css/wegas-pmg.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Tatiana Frosio",
            "id": 3565,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Test quiz",
            "createdTime": 1397400864629,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Guillaume Lehmann",
            "id": 3451,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "TrÃ©sor des pirates",
            "createdTime": 1415868798780,
            "properties": {
              "freeForAll": true,
              "imageUri": "/iconPirate.png",
              "iconUri": "/iconPirate.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "RomÃ©o Jaccard",
            "id": 6504,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Urbactif-v4",
            "createdTime": 1402555675689,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-lobby/images/wegas-urbactif-thumb.png",
              "iconUri": "wegas-lobby/images/wegas-urbactif-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dom scen",
            "id": 4252,
            "description": "",
            "comments": "urbactif-v4",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "VP_test",
            "createdTime": 1416236787729,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-lobby/images/wegas-virtualpatient-thumb.png",
              "iconUri": "/Icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Fabrice Clerc",
            "id": 6558,
            "description": "<p>Simple demo of how Wegas may be used for&nbsp;health care education</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "VP_test",
            "createdTime": 1417014476122,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-lobby/images/wegas-virtualpatient-thumb.png",
              "iconUri": "/Icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Arnould RÃ©mi",
            "id": 6681,
            "description": "<p>Simple demo of how Wegas may be used for&nbsp;health care education</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "Virtual Patient",
            "createdTime": 1395843541382,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-lobby/images/wegas-virtualpatient-thumb.png",
              "iconUri": "/Icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "AlbaSim  ",
            "id": 3001,
            "description": "<p>Simple demo of how Wegas may be used for&nbsp;health care education</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "VirtualPatient - pour tests",
            "createdTime": 1396875787834,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-lobby/images/wegas-virtualpatient-thumb.png",
              "iconUri": "wegas-lobby/images/wegas-virtualpatient-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Guillaume Lehmann",
            "id": 3302,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "VirtualPatient-PourTests(1)",
            "createdTime": 1397547248887,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-lobby/images/wegas-virtualpatient-thumb.png",
              "iconUri": "wegas-lobby/images/wegas-virtualpatient-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Luc Bergeron",
            "id": 3456,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "ZaniMoVille",
            "createdTime": 1420873340402,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Florent Joerin",
            "id": 7012,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "_Empty Scenario",
            "createdTime": 1393289105987,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Admin  ",
            "id": 2652,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "eu",
            "createdTime": 1408442459589,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Admin  ",
            "id": 5101,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "exemple",
            "createdTime": 1422959105829,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "RaphaÃ«l Schmutz",
            "id": 7314,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "grouope_priming",
            "createdTime": 1426174979749,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 7952,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "groupe1_2015_dopamineetrencontre",
            "createdTime": 1425561492295,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 7860,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "groupe2_2015_sommeiletnourriture",
            "createdTime": 1425568478405,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 7861,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "groupe3_2015_sommeilFauxsouvenir",
            "createdTime": 1425570903656,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-flexitests/images/flexitests-thumb.png",
              "iconUri": "wegas-flexitests/images/flexitests-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-flexitests/css/wegas-flexitests.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-flexitests/js/wegas-flexitests-loader.js"
            },
            "createdByName": "Delphine Preissmann",
            "id": 7862,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "hello",
            "createdTime": 1407528750002,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-proggame/images/proggame-thumb-1.png",
              "iconUri": "wegas-proggame/images/proggame-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-proggame/css/wegas-proggame.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-proggame/js/wegas-proggame-loader.js"
            },
            "createdByName": null,
            "id": 4902,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "leaderway CEP",
            "createdTime": 1396619005979,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-leaderway/images/leaderway-thumb.png",
              "iconUri": "wegas-leaderway/images/leaderway-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-leaderway/js/wegas-leaderway-loader.js"
            },
            "createdByName": "Leyun Xia",
            "id": 3259,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "prueba",
            "createdTime": 1418476453818,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Marta Alonso",
            "id": 6860,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "samplegame_1",
            "createdTime": 1396533446200,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Leyun Xia",
            "id": 3201,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "sdfsdfsd",
            "createdTime": 1410770241681,
            "properties": {
              "freeForAll": false,
              "imageUri": "/Thumb_9cases.png",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-teaching/js/wegas-teaching-loader.js"
            },
            "createdByName": null,
            "id": 5804,
            "description": "<p>This game demonstrates how Wegas can be used to create e-learning activities.</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "sfsdsadf",
            "createdTime": 1400860330710,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "dom scentest",
            "id": 3953,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test",
            "createdTime": 1396451515482,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Vincent Zimmermann",
            "id": 3107,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test",
            "createdTime": 1407186161188,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Guillaume Lehmann",
            "id": 4802,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test",
            "createdTime": 1404404137531,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": null
            },
            "createdByName": "Valentin Defferrard",
            "id": 4558,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test",
            "createdTime": 1404469208218,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": null
            },
            "createdByName": "Paul Schneider",
            "id": 4560,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test",
            "createdTime": 1400592627125,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "dom scentest",
            "id": 3861,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test projet",
            "createdTime": 1415094375643,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-proggame/images/proggame-thumb-1.png",
              "iconUri": "wegas-proggame/images/proggame-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-proggame/css/wegas-proggame.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-proggame/js/wegas-proggame-loader.js"
            },
            "createdByName": null,
            "id": 6402,
            "description": "<p>Learn Javascript by coding your way through the game.</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test1",
            "createdTime": 1396615749307,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Vincent Zimmermann",
            "id": 3255,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test2",
            "createdTime": 1422368338026,
            "properties": {
              "freeForAll": false,
              "imageUri": "/Thumb_9cases.png",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-teaching/js/wegas-teaching-loader.js"
            },
            "createdByName": "Patrick Chhen",
            "id": 7206,
            "description": "<p>This game demonstrates how Wegas can be used to create e-learning activities.</p>",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test3",
            "createdTime": 1399030724294,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Tatiana Frosio",
            "id": 3564,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test_2",
            "createdTime": 1404825690931,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-leaderway/images/leaderway-thumb.png",
              "iconUri": "wegas-leaderway/images/leaderway-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": "wegas-leaderway/js/wegas-leaderway-loader.js"
            },
            "createdByName": "Valentin Defferrard",
            "id": 4572,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test_2",
            "createdTime": 1404825824167,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "wegas-teaching/css/wegas-teaching.css",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Valentin Defferrard",
            "id": 4574,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "test_empty",
            "createdTime": 1396870316246,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Leyun Xia",
            "id": 3301,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "testdidac",
            "createdTime": 1416233012741,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dom scen",
            "id": 6552,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "testdidac2",
            "createdTime": 1416234924063,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dom scen",
            "id": 6553,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "testttt",
            "createdTime": 1407936117652,
            "properties": {
              "freeForAll": false,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": null,
            "id": 5002,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "thi_Patient - pour tests",
            "createdTime": 1395752653357,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-lobby/images/wegas-virtualpatient-thumb.png",
              "iconUri": "wegas-lobby/images/wegas-virtualpatient-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "Nicolas Frei",
            "id": 2954,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "thi_fitness",
            "createdTime": 1405947480010,
            "properties": {
              "freeForAll": true,
              "imageUri": "",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Nicolas Frei",
            "id": 4654,
            "description": "<p>Une petite description</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "thi_test",
            "createdTime": 1405946951190,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-proggame/images/proggame-thumb-1.png",
              "iconUri": "wegas-proggame/images/proggame-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-proggame/css/wegas-proggame.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-proggame/js/wegas-proggame-loader.js"
            },
            "createdByName": "Nicolas Frei",
            "id": 4652,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "vptest",
            "createdTime": 1421835768726,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-lobby/images/wegas-virtualpatient-thumb.png",
              "iconUri": "/Icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Patrick Chhen",
            "id": 7102,
            "description": "<p>Simple demo of how Wegas may be used for&nbsp;health care education</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_BaseSimulationPatient",
            "createdTime": 1408364630665,
            "properties": {
              "freeForAll": true,
              "imageUri": "/BaseSimulationPatient.png",
              "iconUri": "/BaseSimulationPatient.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dom scen",
            "id": 5055,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_CrimeSim (v.3)_TestDom",
            "createdTime": 1398403817716,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-crimesim/images/crimesim-thumb.png",
              "iconUri": "wegas-crimesim/images/crimesim-icon.png",
              "pagesUri": "wegas-crimesim/db/wegas-crimesim-pages.json#",
              "cssUri": "wegas-crimesim/css/wegas-crimesim.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-crimesim/js/wegas-crimesim-loader.js"
            },
            "createdByName": "dominique jaccard",
            "id": 3504,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_Droit sociÃ©tÃ©s",
            "createdTime": 1412833603806,
            "properties": {
              "freeForAll": true,
              "imageUri": "/thumbDroit.png",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dom scen",
            "id": 6152,
            "description": "<p>Cours droit comptable et droit des soci&eacute;t&eacute;s</p>",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_EvalCliniqueCardiaque(archive)",
            "createdTime": 1418201291141,
            "properties": {
              "freeForAll": true,
              "imageUri": "/we-club-mon-chomdu-photo4.jpg",
              "iconUri": "/we-club-mon-chomdu-photo4.jpg",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "Maxence Laurent",
            "id": 6802,
            "description": "<p>La Source</p>",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_EvalCliniqueCardiaque-PourDemo",
            "createdTime": 1414566472608,
            "properties": {
              "freeForAll": true,
              "imageUri": "/EvalClinique.png",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dom scen",
            "id": 6352,
            "description": "<p>La Source</p>",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_EvalCliniqueCardiaque-v1",
            "createdTime": 1417602084451,
            "properties": {
              "freeForAll": true,
              "imageUri": "/EvalClinique.png",
              "iconUri": "",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dom scen",
            "id": 6751,
            "description": "<p>La Source</p>",
            "comments": "sauvegarde avant journÃ©e travail avec La Source",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_Leaderway (Empty)",
            "createdTime": 1396516818643,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-leaderway/images/leaderway-thumb.png",
              "iconUri": "wegas-leaderway/images/leaderway-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-leaderway/js/wegas-leaderway-loader.js"
            },
            "createdByName": "Admin  ",
            "id": 3152,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_PMG Artos-0.3",
            "createdTime": 1404984943855,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "Admin  ",
            "id": 4601,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_PMG H&M- sauvegarde dom v1",
            "createdTime": 1413249108743,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "dom scen",
            "id": 6206,
            "description": "<p>Ce cas traite du groupe su&eacute;dois Hennes &amp; Mauritz (H&amp;M), second g&eacute;ant de la mode en Europe. En expansion continuelle, H&amp;M a comme projet d&rsquo;ouvrir la vente sur Internet de ses collections aux Etats-Unis. Vous avez &eacute;t&eacute; nomm&eacute; chef de projet et &ecirc;tes donc responsable du bon d&eacute;roulement de ce projet, bonne chance !</p>\n<p>&nbsp;</p>\n<p>*Ce projet tir&eacute; de la r&eacute;alit&eacute; a &eacute;t&eacute; adapt&eacute; &agrave; des fins d&rsquo;enseignement.</p>\n<p>&nbsp;</p>\n<p>Transfert sc&eacute;nario:</p>\n<p>- choix avant-projet (reste 2 impacts sur probabilit&eacute;, 1 avec dur&eacute;e): 2h15</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_Programming game-0.2",
            "createdTime": 1396962186191,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-proggame/images/proggame-thumb-1.png",
              "iconUri": "wegas-proggame/images/proggame-icon.png",
              "pagesUri": "",
              "cssUri": "wegas-proggame/css/wegas-proggame.css",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": "wegas-proggame/js/wegas-proggame-loader.js"
            },
            "createdByName": "dominique jaccard",
            "id": 3304,
            "description": "<p>Revue des textes d'intro par Dom</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_Urbactif v2",
            "createdTime": 1393082404913,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-lobby/images/wegas-urbactif-thumb.png",
              "iconUri": "wegas-lobby/images/wegas-urbactif-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "dominique jaccard",
            "id": 2629,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_Urbactif v3.1_11 juin",
            "createdTime": 1400560455738,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-lobby/images/wegas-urbactif-thumb.png",
              "iconUri": "wegas-lobby/images/wegas-urbactif-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "dom scen",
            "id": 3855,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_Urbactif v3_archive 28 mai",
            "createdTime": 1401281210750,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-lobby/images/wegas-urbactif-thumb.png",
              "iconUri": "wegas-lobby/images/wegas-urbactif-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "dom scen",
            "id": 3957,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_Urbactif v4 Design Save",
            "createdTime": 1403095887222,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-lobby/images/wegas-urbactif-thumb.png",
              "iconUri": "wegas-lobby/images/wegas-urbactif-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "yannick Lagger",
            "id": 4302,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_Urbactif v4-sauvegarde",
            "createdTime": 1412691821073,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-lobby/images/wegas-urbactif-thumb.png",
              "iconUri": "wegas-lobby/images/wegas-urbactif-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dominique jaccard",
            "id": 6102,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_Urbactif-v1 (personnes)",
            "createdTime": 1392655707506,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-lobby/images/wegas-urbactif-thumb.png",
              "iconUri": "wegas-lobby/images/wegas-urbactif-icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": null,
              "clientScriptUri": null
            },
            "createdByName": "dominique jaccard",
            "id": 2619,
            "description": "",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_Virtual Patient pour tests",
            "createdTime": 1409921704194,
            "properties": {
              "freeForAll": true,
              "imageUri": "wegas-lobby/images/wegas-virtualpatient-thumb.png",
              "iconUri": "/Icon.png",
              "pagesUri": "",
              "cssUri": "",
              "websocket": "",
              "scriptUri": "",
              "clientScriptUri": ""
            },
            "createdByName": "dom scen",
            "id": 5451,
            "description": "<p>This game demonstrates how wegas can be used out of the box.</p>",
            "comments": null,
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }, {
            "@class": "GameModel",
            "name": "zz_pour tests PMG Artos",
            "createdTime": 1425916078632,
            "properties": {
              "freeForAll": false,
              "imageUri": "wegas-pmg/images/pmg-thumb.png",
              "iconUri": "wegas-pmg/images/pmg-icon.png",
              "pagesUri": "wegas-pmg/db/wegas-pmg-pages.json?",
              "cssUri": "wegas-pmg/css/wegas-pmg.css;wegas-pmg/css/wegas-pmg-editor.css",
              "websocket": "",
              "scriptUri": "wegas-pmg/scripts/server-scripts/",
              "clientScriptUri": "wegas-pmg/js/wegas-pmg-loader.js"
            },
            "createdByName": "dom scen",
            "id": 7901,
            "description": "",
            "comments": "",
            "canView": true,
            "canEdit": true,
            "canDuplicate": true,
            "canInstantiate": true
          }];
          scenarios = applyIcon(data);
          deferred.resolve(scenarios);
        });
      }
      return deferred.promise;
    }

    model.getScenario = function(scenarioId) {
      var deferred = $q.defer();
      if (scenarios === null) {
        this.getScenarios().then(function() {
          return deferred.resolve(this.getScenario(scenarioId));
        });
      } else {
        var scenario = findScenario(scenarios, scenarioId);

        // TODO: Fake
        if (scenario === undefined) {
          scenario = findScenario(scenarios, 23234);
        }
        deferred.resolve(scenario);
      }
      return deferred.promise;
    };


    model.getPermissions = function(scenarioId) {

      function mapPermissions(data) {
        /* Transform permissions in a comprehensible way :) */
        var permissions = [];

        var gameRegex = new RegExp(":gm" + scenarioId + "$");
        var itemsRegex = new RegExp(":(.*):");

        /* For each user */
        _.each(data, function(user) {

          /* Search for permissions linked with current scenario */
          var userPermissions = [];
          _.each(user.permissions, function(element, index, list) {
            if (gameRegex.test(element.value)) {
              var items = itemsRegex.exec(element.value);
              userPermissions = userPermissions.concat(items[1].split(","));
            }
          });

          userPermissions = _.uniq(userPermissions); /* Remove duplicates */

          permissions.push({
            user: user,
            permissions: userPermissions
          });

        });
        return permissions;
      }

      var deferred = $q.defer();
      var scenario = findScenario(scenarios, scenarioId);
      if (scenario === null) {
        deferred.resolve({});
      } else {
        $http.get(ServiceURL + "rest/Extended/User/FindAccountPermissionByInstance/gm" + scenarioId).success(function(data) {
          var permissions = mapPermissions(data);
          deferred.resolve(permissions);
        }).error(function(data) {
          deferred.resolve([]);
        });
      }
      return deferred.promise;
    };

  });