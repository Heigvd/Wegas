angular
.module('private.scenarist.history.directives', [
    'ngSanitize',
    ])
.directive('scenaristHistoryIndex', function(ScenariosModel){
    return {
        templateUrl: 'app/private/scenarist/history/tmpl/history-index.html',
        controller : function($scope, $stateParams, $sce) {
            var ctrl = this,
            scenarios = [],
            scenario = null,
            history = null;


        }
    };
})
.directive('scenaristHistoryDownload', function(ScenariosModel){
    return {
        templateUrl: 'app/private/scenarist/history/tmpl/history-download.html',
        controller : function($scope, $stateParams, $sce) {
            var ctrl = this,
            scenarios = [],
            scenario = null,
            history = null;


        }
    };
})
.directive('scenaristHistoryList', function(ScenariosModel){
    return {
        templateUrl: 'app/private/scenarist/history/tmpl/history-list.html',
        controller : function($scope, $stateParams, $sce) {
            var ctrl = this,
            scenarios = [],
            scenario = null,
            history = null;


        }
    };
})