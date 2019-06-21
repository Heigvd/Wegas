angular.module('private.modeler', [
    'private.modeler.directives',
    'private.modeler.archives',
    'private.modeler.settings',
    'private.modeler.comodelers',
    'private.modeler.history',
    'private.modeler.instances'
])
    .config(function($stateProvider) {
        "use strict";
        $stateProvider
            .state('wegas.private.modeler', {
                url: 'modeler',
                views: {
                    'workspace': {
                        controller: 'ModelerCtrl as modelerCtrl',
                        templateUrl: 'app/private/modeler/modeler.tmpl.html'
                    }
                }
            })
        ;
    })
    .controller('ModelerCtrl', function ModelerCtrl($rootScope, $state, Auth, $translate, WegasTranslations) {
        "use strict";
        Auth.getAuthenticatedUser().then(function(user) {
            if (user) {
                if (!user.isModeler && !user.isAdmin) {
                    if (user.isTrainer) {
                        $state.go("wegas.private.trainer");
                    } else {
                        $state.go("wegas.private.player");
                    }
                }
                $("body").removeClass("player admin trainer scenarist").addClass("modeler");
                $rootScope.translationWorkspace = {
                    workspace: WegasTranslations.workspaces.MODELER[$translate.use()]
                };
            }
        });
    });