'use strict';
angular.module('wegas.models.users', [])
    .service('UsersModel', function ($http, $q) {
        var model = this,
            users;

        model.getUsers = function() {
            return "Here is all users";
        };
    })
;
