'use strict';
angular.module('wegas.models.users', [])
.service('UsersModel', function ($http, $q) {
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

        $http
        .get(ServiceURL + url)
        .success(function(data){
            deferred.resolve(data);
        }).error(function(data) {
            deferred.resolve(false);
        });
        return deferred.promise;
    }

    model.updateUser = function(user) {

        var deferred = $q.defer();

        var url = "rest/Extended/User/Account/" + user.id;

        delete user.hash
        delete user.name

        $http
        .put(ServiceURL + url, user)
        .success(function(data){
            deferred.resolve(data);
        }).error(function(data) {
            deferred.resolve(false);
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
        .success(function(data){
            deferred.resolve(data);
        }).error(function(data) {
            deferred.resolve([]);
        });
        return deferred.promise;
    }
})
;
