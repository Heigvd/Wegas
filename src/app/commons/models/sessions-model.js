'use strict';
angular.module('wegas.models.sessions', [])
    .service('SessionsModel', function () {
        var model = this,
            sessions;

        model.getManagedSessions = function () {
            return "Here is all the managed sessions for a trainer";
        };

        model.getPlayedSessions = function () {
            return "Here is all the played sessions for a player";
        };
    })
;
