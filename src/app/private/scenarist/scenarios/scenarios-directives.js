angular.module('private.scenarist.scenarios.directives', [
    'infinite-scroll'
    ])
.directive('scenaristScenariosIndex', function(ScenariosModel){
  return {
    templateUrl: 'app/private/scenarist/scenarios/scenarios-directives.tmpl/scenarios-index.tmpl.html',
    controller : function($scope, $rootScope) {
        var ctrl = this;
        $scope.scenarios = [];

        ctrl.updateScenarios = function() {
            ScenariosModel.getScenarios().then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    $scope.scenarios = _.sortBy(response.data, function(s) {
                        return s.name.toLowerCase();
                    });
                }
            });
        };
        $rootScope.$on('scenarios', function(e, newScenarios){
            if (newScenarios) {
                ctrl.updateScenarios();
            }
        });
        ctrl.updateScenarios();

        ctrl.editName = function(scenario) {
            ScenariosModel.updateScenario(scenario).then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    ctrl.updateScenarios();
                }
            });
        };
        ctrl.editComments = function(scenario) {
            ScenariosModel.updateScenario(scenario).then(function(response) {
                if (response.isErroneous()) {
                    response.flash();
                } else {
                    ctrl.updateScenarios();
                }
            });
        };
        ctrl.archiveScenario = function (scenario) {
            if (confirm('Etes-vous sur ?')) {
                ScenariosModel.archiveScenario(scenario).then(function (result) {
                    if (response.isErroneous()) {
                        response.flash();
                    } else {
                        ctrl.updateScenarios();
                    }
                });
            }
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

            ScenariosModel.createScenario(scope.newScenario.name, scope.newScenario.basedOn.id).then(function(response) {
                if (!response.isErroneous()) {
                    parentCtrl.scenarios.push(response.data);
                } else {
                    response.flash();
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
        $scope.scenarios = [];
        $scope.scenariosLoaded = false;
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

        $scope.$watch("scenarios", function(newScenario, oldScenario){
            if (newScenario !== undefined && newScenario.length > 0) {
                $scope.scenariosLoaded = true;
                $scope.visibleScenarios = [];
                $scope.scenarios = newScenario;


                $scope.filter();
            }
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

            scope.archiveScenario = function (scenario) {
                parentCtrl.archiveScenario(scenario);
            }
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