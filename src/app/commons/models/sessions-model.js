'use strict';
angular.module('wegas.models.sessions', [])
.service('SessionsModel', function ($http, $q, Auth) {

    var model = this,
    managedSessions = null,
    playedSessions = null;

    var findSession = function(sessions, id){
        return _.find(sessions, function (s) { return s.id == id; });
    }
    /* Get all managed sessions */
    model.getManagedSessions = function () {
        var deferred = $q.defer();
        if(managedSessions != null){
            deferred.resolve(managedSessions);
        }else{
            managedSessions = [];
            $http.get(ServiceURL + "rest/GameModel/Game?view=EditorExtended").success(function(data){
                managedSessions = data;
                deferred.resolve(managedSessions);
            }).error(function(data){
                managedSessions = [];
                managedSessions.push({
                    id: 1,
                    name: "lorem ipsum",
                    createdTime: "17.03.2015",
                    comments: "no comment"
                });
                deferred.resolve(managedSessions);
            });
        }
        return deferred.promise;
    };

    /* Return a specific session based on her id */
    model.getManagedSession = function(id){
        var deferred = $q.defer();
        if (managedSessions == null) {
            model.getManagedSessions().then(function(data){
                var session = findSession(managedSessions, id);
                deferred.resolve(session);
            });
        } else {
            var session = findSession(managedSessions, id);
            deferred.resolve(session);
        }
        return deferred.promise;
    };

    /* Crée une nouvelle session managée */
    model.createManagedSession = function(sessionName, scenarioId){
        var deferred = $q.defer();
        Auth.getAuthenticatedUser().then(function(user){
            if(user != null) {
                /* Todo Check Values ? */
                var newSession = {
                    "@class": "Game",
                    "gameModelId": scenarioId,
                    "name": sessionName
                };
                $http.post(ServiceURL + "rest/GameModel/Game/"+ user.id, newSession).success(function(data){
                    console.log(data);
                    managedSessions.push({
                        id : data.id,
                        name : data.name,
                        createdTime : data.createdTime,
                        comments : ""
                    });
                    deferred.resolve(managedSessions[data.id]);
                }).error(function(data){
                    /* TODO - Improve error mgt */
                    deferred.resolve(null);
                });
            }else{
                deferred.resolve(null);
            }
        });
        return deferred.promise;
    };

    /* Return all played sessions */
    model.getPlayedSessions = function () {
        var deferred = $q.defer();
        Auth.getAuthenticatedUser().then(function(user){
            if(user != null){
                if(playedSessions != null){
                    deferred.resolve(playedSessions);
                } else {
                    playedSessions = [];
                    $http.get(ServiceURL + "rest/RegisteredGames/"+ user.id).success(function(data){
                        playedSessions = data
                        deferred.resolve(playedSessions);
                    }).error(function(data){
                        playedSessions = [];
                        deferred.resolve(playedSessions);
                    });
                }
            } else {
                deferred.resolve(playedSessions);
            }
        });
        return deferred.promise;
    };

    /* Retourne la session jouée correspondant à l'id, undefined sinon. */
    model.getPlayedSession = function(id){
        var deferred = $q.defer();
        if(playedSessions == null){
            model.getPlayedSessions().then(function(data){
                var session = findSession(playedSessions, id);
                deferred.resolve(session);
            });
        }else{
            var session = findSession(playedSessions, id);
            deferred.resolve(session);
        }
        return deferred.promise;
    };

    model.joinSession = function (token) {
        /* TODO */
    }

    model.clearCache = function(){
        managedSessions = null;
        playedSessions = null;
    };
})
;
