'use strict';
angular
    .module('wegas.models.roles', [])
    .service('RolesModel', function($http, $q, $interval, Responses) {
        var model = this,
            roles = {
                cache: null,
                findRole: function(id) {
                    return _.find(roles.cache.data, function(s) {
                        return s.id == id;
                    });
                },
                stopWaiting: function(waitFunction) {
                    $interval.cancel(waitFunction);
                },
                wait: function() {
                    var deferred = $q.defer(),
                        waitRoles = $interval(function() {
                            if (!roles.cache.loading) {
                                roles.stopWaiting(waitRoles);
                                deferred.resolve(true)
                            }
                        }, 500);
                    return deferred.promise;
                }
            },
            /* Cache all roles in a list */
            cacheRoles = function() {
                var deferred = $q.defer();
                if (roles.cache) {
                    var url = "rest/Role/";
                    $http.get(ServiceURL + url, {
                        "headers": {
                            "managed-mode": "true"
                        }
                    }).success(function(data) {
                        if (data.events !== undefined && data.events.length == 0) {
                            roles.cache.data = data.entities;
                            deferred.resolve(Responses.success("Roles loaded", roles.cache));
                        } else if (data.events !== undefined) {
                            roles.cache.data = [];
                            deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                        } else {
                            roles.cache.data = [];
                            deferred.resolve(Responses.danger("Whoops...", false));
                        }
                    }).error(function(data) {
                        if (data.events !== undefined && data.events.length > 0) {
                            deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                        } else {
                            deferred.resolve(Responses.danger("Whoops...", false));
                        }
                    });
                } else {
                    roles.cache = [];
                    deferred.resolve(roles.cache);
                }
                return deferred.promise;
            };

        model.getRoles = function() {
            var deferred = $q.defer();

                if (roles.cache) {
                    if (roles.cache.loading) {
                        roles.wait().then(function() {
                            deferred.resolve(Responses.success("Roles found", roles.cache.data));
                        });
                    } else {
                        deferred.resolve(Responses.success("Roles found", roles.cache.data));
                    }
                } else {
                    roles.cache = {
                        data: null,
                        loading: true
                    };
                    cacheRoles().then(function(response) {
                        roles.cache.loading = false;
                        deferred.resolve(Responses.info(response.message, roles.cache.data));
                    });
                }
                return deferred.promise;

        };




    });