angular.module('wegas.directives.search.tool', [])
    .directive('searchTool', function() {
        "use strict";
        return {
            templateUrl: 'app/commons/directives/search-tool.tmpl.html',
            scope: {
                searchTool: "="
            }
        };
    });

