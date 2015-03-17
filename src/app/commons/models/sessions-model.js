'use strict';
angular.module('wegas.models.sessions', [])
    .service('SessionsModel', function ($http, $q) {
        var model = this,
            managedSessions = null,
            playedSessions = [];

        model.getManagedSessions = function () {
            var deferred = $q.defer();
            if(managedSessions != null){
                deferred.resolve(managedSessions);
            }else{
                managedSessions = [];
                $http.get(ServiceURL + "rest/GameModel/Game?view=EditorExtended").success(function(data){
                    data.forEach(function(elem){
                        managedSessions[elem.id] = {
                            id : elem.id,
                            name : elem.name
                        };
                    });
                    deferred.resolve(managedSessions);
                }).error(function(data){
                    managedSessions = [];
                    deferred.resolve(managedSessions);
                });
            }
            return deferred.promise;
        };

        model.getManagedSession = function(id){
            if(managedSessions == null){
                model.getManagedSessions().then(function(data){
                    return managedSessions[id];
                });
            }else{
                return managedSessions[id];
            }
        };

        model.getPlayedSessions = function () {
            return "Here is all the played sessions for a player";
        };
    })
;
