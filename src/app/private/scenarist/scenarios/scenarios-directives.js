angular.module('private.scenarist.scenarios.directives', [
'infinite-scroll'
])
.directive('scenaristScenariosIndex', function(ScenariosModel){
  return {
    templateUrl: 'app/private/scenarist/scenarios/scenarios-directives.tmpl/scenarios-index.tmpl.html',
    controller : function(){
        var ctrl = this;
        ctrl.scenarios = [];
        ctrl.search = "";
        ScenariosModel.getScenarios().then(function(scenarios) {
            ctrl.scenarios = scenarios;
        });
        ctrl.updateScenario = function() {
            ScenariosModel.getScenarios().then(function(scenarios) {
                ctrl.scenarios = scenarios;
            });
        };
        ctrl.editName = function(scenario) {
            ScenariosModel.updateScenario(scenario).then(function(data) {
                ctrl.updateScenario();
            });
        };
        ctrl.editComments = function(scenario) {
            ScenariosModel.updateScenario(scenario).then(function(data) {
                ctrl.updateScenario();
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
            if (scope.newScenario.name === "") {
                alert('Le nom ne peut pas être vide');
                return;
            } else if (scope.newScenario.basedOn.id === undefined) {
                alert('Il faut choisir un scenario de base');
                return
            }

            ScenariosModel.createScenario(scope.newScenario.name, scope.newScenario.basedOn.id).then(function(result) {
                if (result.id !== undefined) {
                    parentCtrl.scenarios.push(result);
                } else {
                    alert(result);
                }
            });
        };
    }
};
})
.directive('scenaristScenariosList', function(ScenariosModel) {
  return {
    templateUrl: 'app/private/scenarist/scenarios/scenarios-directives.tmpl/scenarios-list.tmpl.html',
    scope: false,
    require: "^scenaristScenariosIndex",
    link : function($scope, element, attrs, parentCtrl) {
        $scope.visibleScenarios = [];
        $scope.busy = false;
        $scope.search = '';

        $scope.filter = function () {
            if ($scope.search == '') {
                $scope.visibleScenarios = [];
                $scope.loadMore();
            } else if ($scope.search == '*') {
                $scope.visibleScenarios = $scope.scenarios;
            } else {
                $scope.visibleScenarios = _.filter($scope.scenarios, function(s) {
                    return s.name.toLowerCase().indexOf($scope.search.toLowerCase()) > -1;
                });

            }
        }
        $scope.loadMore = function() {
            if ($scope.busy || $scope.search != '' || $scope.scenarios.length == 0) return;
            $scope.busy = true;
            var last = $scope.visibleScenarios.length;
            for(var i = last; i < last + 13; i++) {
                $scope.visibleScenarios.push($scope.scenarios[i]);
            }
            $scope.busy = false;
        };

        $scope.$watch(function(){
            return parentCtrl.scenarios
        }, function(newScenario, oldScenario){
            $scope.scenarios = _.sortBy(newScenario, function(s) {
                return s.name.toLowerCase();
            });
            $scope.loadMore();
        });
    }
};
})
.directive('scenarioCard', function() {
    return {
        templateUrl: 'app/private/scenarist/scenarios/scenarios-directives.tmpl/scenarios-card.tmpl.html',
        restrict: 'A',
        require: "^scenaristScenariosIndex",
        scope: {
         scenario: '='
     },
     link : function(scope, element, attrs, parentCtrl){
            // Private function
            var resetScenarioToSet = function(){
                scope.copy = scope.scenario;
            }
            scope.copy = scope.scenario;

            // Public parameters
            scope.editingName = false;
            scope.editingComments = false;
            resetScenarioToSet();

            // Public function
            scope.toogleEditingName = function(){
                if(scope.editingComments){
                    scope.toogleEditingComments();
                }
                scope.editingName = (!scope.editingName);
                resetScenarioToSet();
            };

            // Public function
            scope.editName = function(){
                parentCtrl.editName(scope.copy);
                scope.toogleEditingName();
            };

            // Public function
            scope.toogleEditingComments = function(){
                if(scope.editingName){
                    scope.toogleEditingName();
                }
                scope.editingComments = (!scope.editingComments);
                resetScenarioToSet();
            };

            // Public function
            scope.editComments = function(){
                parentCtrl.editComments(scope.copy);
                scope.toogleEditingComments();
            };

        }
    }
});