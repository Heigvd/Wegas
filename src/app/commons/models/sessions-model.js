'use strict';
angular.module('wegas.models.sessions', [])
    .service('SessionsModel', function ($http, $q, Auth) {
        var model = this,
            managedSessions = null,
            playedSessions = null;

        // Retourne toutes les sessions managées, un tableau vide si un utilisateur n'a aucune session.
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

        // Retourne la session managée correspondant à l'id, undefined sinon.
        model.getManagedSession = function(id){
            var deferred = $q.defer();
            if(managedSessions == null){
                model.getManagedSessions().then(function(data){
                    deferred.resolve(managedSessions[id]);
                });
            }else{
                deferred.resolve(managedSessions[id]);
            }
            return deferred.promise;
        };

        // Crée une nouvelle session managée
        model.createManagedSession = function(sessionName, scenarioId){
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user){
                if(user != null){
                    var newSession = {
                        "@class": "Game",
                        "gameModelId": scenarioId,
                        "name": sessionName
                    };
                    $http.post(ServiceURL + "rest/GameModel/Game/"+ user.id, newSession).success(function(data){
                        managedSessions[data.id] = {
                            id : data.id,
                            name : data.name
                        };
                        deferred.resolve(managedSessions[data.id]);
                    }).error(function(data){
                        // ToDo - Améliorer la gestion d'erreur
                        deferred.resolve(null);
                    });
                }else{
                    deferred.resolve(null);
                }
            });
            return deferred.promise;
        };

        // Retourne toutes les sessions jouées, un tableau vide si un utilisateur n'a aucune session.
        model.getPlayedSessions = function () {
            var deferred = $q.defer();
            Auth.getAuthenticatedUser().then(function(user){
                if(user != null){
                    if(playedSessions != null){
                        deferred.resolve(playedSessions);
                    }else{
                        playedSessions = [];
                        $http.get(ServiceURL + "rest/RegisteredGames/"+ user.id).success(function(data){
                            data.forEach(function(elem){
                                playedSessions[elem.id] = {
                                    id : elem.id,
                                    name : elem.name
                                };
                            });
                            deferred.resolve(playedSessions);
                        }).error(function(data){
                            playedSessions = [];
                            deferred.resolve(playedSessions);
                        });
                    }
                }else{
                    deferred.resolve(playedSessions);
                }
            });
            return deferred.promise;
        };

        // Retourne la session jouée correspondant à l'id, undefined sinon.
        model.getPlayedSession = function(id){
            var deferred = $q.defer();
            if(playedSessions == null){
                model.getPlayedSessions().then(function(data){
                    deferred.resolve(playedSessions[id]);
                });
            }else{
                deferred.resolve(playedSessions[id]);
            }
            return deferred.promise;
        };

        model.clearCache = function(){
            managedSessions = null;
            playedSessions = null;
        }
    })
;
