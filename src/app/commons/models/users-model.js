'use strict';
angular.module('wegas.models.users', [])
.service('UsersModel', function ($http, $q) {
    var model = this,
    users;

    model.getUsers = function() {
        return "Here is all users";
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
