angular.module('private.trainer.sessions.customize.directives', [
])
    .directive('trainerSessionsCustomizeIndex', function() {
        return {
            scope: {
                close: "&"
            },
            templateUrl: 'app/private/trainer/sessions/customize/directives.tmpl/index.html',
            controller: "TrainerSessionsCustomizeIndexController as customizeIndexCtrl"
        };
    }).controller("TrainerSessionsCustomizeIndexController", function TrainerSessionsCustomizeIndexController($stateParams, SessionsModel) {
        var ctrl = this;
        ctrl.session = {};
        ctrl.infosTabActived = true;
        ctrl.iconTabActived = false;
        ctrl.colorTabActived = false;

        ctrl.updateSession = function() {
            SessionsModel.getSession("managed", $stateParams.id, true).then(function(response) {
                ctrl.session = response.data || {};
                if (response.isErroneous()) {
                    response.flash();
                }
            });
        };

        ctrl.save = function(){
            
        };

        ctrl.updateSession();
    });