'use strict';
angular.module('wegas.models.scenarios', [])
    .service('ScenariosModel', function ($http, $q) {
        var model = this,
            scenarios = null;

        model.getScenarios = function () {
            var deferred = $q.defer();
            if(scenarios != null){
                deferred.resolve(scenarios);
            }else{
                scenarios = [];
                $http.get(ServiceURL + "rest/Public/GameModel/?view=EditorExtended").success(function(data){
                    data.forEach(function(elem){
                        scenarios.push({
                            id : elem.id,
                            name : elem.name
                        });
                    });
                    deferred.resolve(scenarios);
                }).error(function(data){
                    scenarios = [];
                    deferred.resolve(scenarios);
                });
            }
            return deferred.promise;
        };    

    })
;
