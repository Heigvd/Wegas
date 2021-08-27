angular.module('public.signup', [
    'public.signup.directives'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.public.signup', {
                url: '/signup',
                views: {
                    "modal@wegas.public": {
                        controller: 'PublicSignupModalCtrl'
                    }
                },
                params: {
                    redirectTo: null
                }
            });
    })
    .controller('PublicSignupModalCtrl', function PublicSignupModalCtrl($animate, $stateParams,
        $state, WegasModalService) {
        "use strict";
        WegasModalService.displayAModal({
            templateUrl: 'app/public/signup/signup.tmpl.html',
            controller: "ModalsController as modalsCtrl"
        }).then(function(modal) {
            modal.close.then(function(result) {
                // should redirect ?
                var redirect;

                if ($stateParams.redirectTo) {
                    redirect = $stateParams.redirectTo;
                } else {
                    var qsRedirect = window.WegasHelper.getQueryStringParameter("redirect");
                    if (qsRedirect) {
                        $scope.redirect = decodeURIComponent(qsRedirect);
                    }
                }

                if (redirect) {
                    var host = window.ServiceURL + window.location.pathname;
                    if (host.endsWith("/") && redirect.startsWith("/")) {
                        redirect = redirect.slice(1);
                    }
                    window.location.href = host + redirect;
                } else {
                    $state.go('wegas'); // Before direct login: "^"
                }
            });
        });
    });
