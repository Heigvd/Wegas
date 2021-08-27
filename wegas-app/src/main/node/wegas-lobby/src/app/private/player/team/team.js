angular.module('private.player.team', [
        'private.player.team.directives'
    ])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.player.team', {
                url: '/{id}/team',
                views: {
                    'modal@wegas.private': {
                        controller: 'TeamModalCtrl'
                    }
                }
            });
    }).controller("TeamModalCtrl", function TeamModalCtrl($animate, $state, WegasModalService) {
    "use strict";
    WegasModalService.displayAModal({
        templateUrl: 'app/private/player/team/team.tmpl.html',
        controller: "ModalsController as modalsCtrl"
    }).then(function(modal) {
        modal.close.then(function(result) {
            $state.go("^");
        });
    });
});
