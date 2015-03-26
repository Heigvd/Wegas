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

        var url = "rest/Extended/User/addAccountPermission/"+
                  "GameModel:"+permissions+":gm"+scenarioId+"/"+ userId;
        // Updating permissions
        $http
        .post(ServiceURL + url, null, {
          "headers": {
            "managed-mode": "true"
          }
        })
        .success(function(data){

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

    var url = "rest/Extended/User/DeleteAccountPermissionByInstanceAndAccount/gm"+scenarioId+"/" + userId;

    $http
    .delete(ServiceURL + url, {
      "headers": {
        "managed-mode": "true"
      }
    })
    .success(function(data){
      deferred.resolve(true);
    }).error(function(data) {
      deferred.resolve(data);
    });
    return deferred.promise;
  }
})
.service('ScenariosModel', function ($http, $q, PermissionModel) {
  var model = this,
  scenarios = null;


  function findScenario (scenarios, id) {
    return _.find(scenarios, function (s) { return s.id == id; });
  }

  model.createScenario = function(name, templateId) {
    var deferred = $q.defer();

    $http.post(ServiceURL + "rest/Public/GameModel/" + templateId, {
      "@class":"GameModel",
      "templateId": templateId,
      "name": name,
      "properties":{}
    }).success(function(data){
      deferred.resolve(data);
    }).error(function(data){
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

  model.getScenarios = function () {
    var deferred = $q.defer();
    if(scenarios !== null){
      deferred.resolve(scenarios);
    } else {
      scenarios = [];
      $http.get(ServiceURL + "rest/Public/GameModel/?view=EditorExtended").success(function(data){
        scenarios = data;
        deferred.resolve(scenarios);
      }).error(function(data){
        scenarios = [];
        deferred.resolve(scenarios);
      });
    }
    return deferred.promise;
};

model.getScenario = function (scenarioId) {
  var deferred = $q.defer();
  if(scenarios === null) {
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


  model.getPermissions = function (scenarioId) {

    function mapPermissions(data) {
      /* Transform permissions in a comprehensible way :) */
var permissions = [];

var gameRegex = new RegExp(":gm"+ scenarioId +"$");
var itemsRegex = new RegExp(":(.*):");

/* For each user */
_.each(data, function (user) {

  /* Search for permissions linked with current scenario */
  var userPermissions = [];
  _.each(user.permissions, function (element, index, list) {
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
  $http.get(ServiceURL + "rest/Extended/User/FindAccountPermissionByInstance/gm" + scenarioId).success(function(data){
    var permissions = mapPermissions(data);
    deferred.resolve(permissions);
  }).error(function(data) {
    deferred.resolve([]);
  });
}
return deferred.promise;
};

});
