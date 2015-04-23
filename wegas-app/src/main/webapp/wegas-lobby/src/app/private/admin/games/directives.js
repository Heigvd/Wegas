angular.module('private.admin.games.directives', [])
    .directive('adminGamesIndex', function() {
        return {
            templateUrl: 'app/private/admin/games/directives.tmpl/index.html',
            controller: "AdminGamesIndexController as AdminGamesIndexCtrl"
        };
    })
    .controller("AdminGamesIndexController", function AdminGamesIndexController($rootScope, Flash) {
        var ctrl = this;
        // TODO
    })
    .directive('adminGamesList', function(Flash) {
        return {
            templateUrl: 'app/private/admin/games/directives.tmpl/list.html',
            scope: false,
            require: "^adminGamesIndex",
            link: function(scope, element, attrs, parentCtrl) {
                // TODO
            }
        };
    })