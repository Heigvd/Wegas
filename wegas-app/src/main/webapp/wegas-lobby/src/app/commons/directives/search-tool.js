angular.module('wegas.directives.search.tool', [])      
    .directive('searchTool', function() {
            return {
                templateUrl: 'app/commons/directives/search-tool.tmpl.html',
                scope: {
                    searchTool: "="
                }
            };
    });

