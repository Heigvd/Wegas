'use strict';
angular.module('wegas.models.users', [])
    .service('UsersModel', function($http, $q, Responses) {
        var model = this,
            users;

        model.getUsers = function() {
            return "Here is all users";
        };

        model.getUser = function(id) {
            var deferred = $q.defer();

            if (isNaN(id)) {
                deferred.resolve(false);
                return;
            }

            var url = "rest/Extended/User/Account/" + id;

            $http.get(ServiceURL + url, {
                "headers": {
                    "managed-mode": "true"
                }
            }).success(function(data) {
                if (data.events !== undefined && data.events.length == 0) {
                    deferred.resolve(Responses.success("Profile loaded", data.entities[0]));
                } else if (data.events !== undefined) {
                    deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                } else {
                    deferred.resolve(Responses.danger("Whoops...", false));
                }
            }).error(function(data) {
                if (data.events !== undefined && data.events.length > 0) {
                    deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                } else {
                    deferred.resolve(Responses.danger("Whoops...", false));
                }
            });
            return deferred.promise;
        }

        model.updateUser = function(user) {

            var deferred = $q.defer();

            if (user.password != user.password2) {
                deferred.resolve(Responses.danger("Passwords do not match...", false));
                return deferred.promise;
            }
            delete user.hash
            delete user.name
            delete user.password2

            var url = "rest/Extended/User/Account/" + user.id;
            $http
                .put(ServiceURL + url, user, {
                    "headers": {
                        "managed-mode": "true"
                    }
                })
                .success(function(data) {
                    if (data.events !== undefined && data.events.length == 0) {
                        deferred.resolve(Responses.success("Profile updated", data.entities[0]));
                    } else if (data.events !== undefined) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    }
                }).error(function(data) {
                    if (data.events !== undefined && data.events.length > 0) {
                        deferred.resolve(Responses.danger(data.events[0].exceptions[0].message, false));
                    } else {
                        deferred.resolve(Responses.danger("Whoops...", false));
                    }
                });
            return deferred.promise;
        };

        /* Find user with a pattern in a list of groups (Player, Trainer, Scenarist, Administrator) */
        model.autocomplete = function(pattern, rolesList) {
            var deferred = $q.defer();

            var url = "rest/User/AutoComplete/" + pattern;

            $http
                .post(ServiceURL + url, {
                    "rolesList": rolesList
                })
                .success(function(data) {
                    deferred.resolve(data);
                }).error(function(data) {
                    deferred.resolve([]);
                });
            return deferred.promise;
        }
    });