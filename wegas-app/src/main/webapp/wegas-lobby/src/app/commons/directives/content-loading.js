angular.module('wegas.directives.content.loading', [])
    .directive('contentLoading', function() {
        return {
            templateUrl: 'app/commons/directives/content-loading.tmpl.html',
            scope: {
                "message": '@contentLoading'
            }
        };
    });      
