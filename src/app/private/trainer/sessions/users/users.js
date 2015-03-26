angular.module('private.trainer.sessions.users', [
    'private.trainer.sessions.users.directives'
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.private.trainer.sessions.users', {
            url: '/:id/users',
            views: {
                'modal@wegas.private':{
                    controller: 'TrainerSessionsUsers as trainerSessionsUsers'
                }
            }
        })
    ;
}).controller("TrainerSessionsUsers", function TrainerSessionsUsers($animate, $state, ModalService){
    var trainerSessionsUsers = this;

    ModalService.showModal({
        templateUrl: 'app/private/trainer/sessions/users/users.tmpl.html',
        controller: "TrainerModalController as trainerModalCtrl"
    }).then(function(modal) {
        var box = $(".modal"),
            shadow = $(".shadow");      
        $animate.addClass(box, "modal--open");
        $animate.addClass(shadow, "shadow--show");

        modal.close.then(function(result) {
            $state.go("wegas.private.trainer.sessions");
        });
    }); 
    
}).controller('TrainerModalController', function TrainerModalController($animate, close) {
    trainerModalCtrl = this;    
    trainerModalCtrl.close = function() {
        var box = $(".modal"),
            shadow = $(".shadow");      
        $animate.removeClass(shadow, "shadow--show");
        $animate.removeClass(box, "modal--open").then(function(){
            close();
        });
    };
})
;