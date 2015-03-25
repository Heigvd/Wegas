angular.module('private.scenarist.scenarios.directives', [
])
.directive('scenaristScenariosIndex', function(ScenariosModel){
  return {
    templateUrl: 'app/private/scenarist/scenarios/scenarios-directives.tmpl/scenarios-index.tmpl.html',
    controller : function(){
        var ctrl = this;
        ctrl.scenarios = [];
        ScenariosModel.getScenarios().then(function(scenarios) {
            ctrl.scenarios = scenarios;
        });
        ctrl.updateScenario = function() {
            ScenariosModel.getScenarios().then(function(scenarios) {
                ctrl.scenarios = scenarios;
            });
        };
    }
  };
})

.directive('scenaristScenarioCreate', function(ScenariosModel) {
  return {
    templateUrl: 'app/private/scenarist/scenarios/scenarios-directives.tmpl/scenario-create.tmpl.html',
    scope: false,
    require: "^scenaristScenariosIndex",
    link : function(scope, element, attrs, parentCtrl) {
         scope.newScenario = {
            name : "",
            basedOn: parentCtrl.scenarios
        };
        scope.$watch("scenarios" , function(n,o) {
            scope.newScenario.basedOn = n;
        });
        scope.createScenario = function() {
            // TODO
            alert('Sorry... Not yet implemented...');
        };
    }
  };
})
.directive('scenaristScenariosList', function(ScenariosModel) {
  return {
    templateUrl: 'app/private/scenarist/scenarios/scenarios-directives.tmpl/scenarios-list.tmpl.html',
    scope: false,
    require: "^scenaristScenariosIndex",
    link : function(scope, element, attrs, parentCtrl){
        scope.$watch(function(){
            return parentCtrl.scenarios
        }, function(newScenario, oldScenario){
            scope.scenarios = newScenario;
        });
    }
  };
});