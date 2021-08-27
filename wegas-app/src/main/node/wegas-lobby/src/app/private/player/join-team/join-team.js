angular.module('private.player.join', [
    'private.player.join.directives'
])
.config(function ($stateProvider) {
    "use strict";
    $stateProvider
        .state('wegas.private.join', {
            url: '/:token',
            views: {
                'modal@wegas.private': {
                    controller: 'SessionJoinModalCtrl as sessionJoinModalCtrl'
                }
            }
        })
    ;
}).controller("SessionJoinModalCtrl", function SessionJoinModalCtrl($animate, $state, WegasModalService){
    "use strict";
	WegasModalService.displayAModal({
        templateUrl: 'app/private/player/join-team/join-team.tmpl.html',
        controller: "ModalsController as modalsCtrl"
    }).then(function(modal) {
        modal.close.then(function() {
            $state.go("wegas.private.player");
        });
    });
});
