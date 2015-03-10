'use strict';
angular.module('wegas.models.scenarios', [])
    .service('ScenariosModel', function () {
        var model = this,
            scenarios;
            
        model.getScenarios = function () {
            return "Here is all the scenarios for a scenarist";
        };
    })
;
