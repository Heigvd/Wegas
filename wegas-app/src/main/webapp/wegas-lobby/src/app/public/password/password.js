angular.module('public.password', [
])
.config(function ($stateProvider) {
    $stateProvider
        .state('wegas.public.password', {
            url: '/password',
            views: {
        		"form" :{
            		controller: 'PublicPasswordCtrl as publicPasswordCtrl',
            		templateUrl: 'app/public/password/password.tmpl.html'
            	}
            }
            
        })
    ;
})
.controller('PublicPasswordCtrl', function ($state, $stateParams, Auth) {
var publicPasswordCtrl = this;
    publicPasswordCtrl.formInfo = {};
    var remindPassword = function () {

        console.log("-> Reminding user password");

        /* TODO: Implement correct form validation */
        if (publicPasswordCtrl.formInfo.email != "") {
            Auth.remindPassword(publicPasswordCtrl.formInfo.email).then(function(result) {
                if(result === true) {
                    /* TODO: Implement sweet and nice information/modal message */
                    window.alert('Thanks. If the account exists, you will receive an email to reset your password!');
                } else {
                    /* TODO: Implement sweet and nice information/modal message */
                    /* It seems the services return always true */
                    window.alert('Oups... An error has occurred...');
                }
            });
        } else {
            /* TODO: Implement sweet and nice information/modal message */
            window.alert('Username is empty..');
        }
    }
    publicPasswordCtrl.remindPassword = remindPassword;
})
;