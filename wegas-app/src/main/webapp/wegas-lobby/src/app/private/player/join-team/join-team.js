angular.module('private.player.join', [
    'private.player.join.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.player.join', {
            url: '/{token}',
            views: {
                'modal@wegas.private': {
                    controller: 'SessionJoinModalCtrl as sessionJoinModalCtrl'
                }
            }
        })
    ;
}).controller("SessionJoinModalCtrl", function SessionJoinModalCtrl($animate, $state, ModalService){
	ModalService.showModal({
        templateUrl: 'app/private/player/join-team/join-team.tmpl.html',
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