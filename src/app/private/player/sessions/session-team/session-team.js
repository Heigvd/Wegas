angular.module('private.player.session.team', [
	'private.player.session.team.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player.sessions.team', {
            url: '/{id}/team',
            views: {
                'modal@wegas.private': {
                    controller: 'SessionTeamModalCtrl as sessionTeamModalCtrl'
                }
            }
        })
    ;
}).controller("SessionTeamModalCtrl", function SessionTeamModalCtrl($animate, $state, ModalService){
	ModalService.showModal({
        templateUrl: 'app/private/player/sessions/session-team/session-team.tmpl.html',
        controller: "ModalsController as modalsCtrl"
    }).then(function(modal) {
        var box = $(".modal"),
            shadow = $(".shadow");      
        $animate.addClass(box, "modal--open");
        $animate.addClass(shadow, "shadow--show");

        modal.close.then(function(result) {
            $state.go("^");
        });
    });
});