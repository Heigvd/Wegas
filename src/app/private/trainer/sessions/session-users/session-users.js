angular.module('private.trainer.sessions.users', [
    'private.trainer.sessions.users.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer.sessions.users', {
            url: '/:id/users',
            views: {
                'modal@wegas.private':{
                    controller: 'TrainerSessionsUsers'
                }
            }
        })
    ;
}).controller("TrainerSessionsUsers", function TrainerSessionsUsers($animate, $state, ModalService){
    ModalService.showModal({
        templateUrl: 'app/private/trainer/sessions/session-users/session-users.tmpl.html',
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