angular.module('private.player.team', [
	'private.player.team.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player.team', {
            url: '/{id}/team',
            views: {
                'modal@wegas.private': {
                    controller: 'TeamModalCtrl'
                }
            }
        })
    ;
}).controller("TeamModalCtrl", function TeamModalCtrl($animate, $state, ModalService){
	ModalService.showModal({
        templateUrl: 'app/private/player/team/team.tmpl.html',
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