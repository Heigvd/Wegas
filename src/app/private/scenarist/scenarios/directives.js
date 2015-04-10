angular.module('private.scenarist.scenarios.directives', [
    'infinite-scroll'
    ])
.directive('scenaristScenariosIndex', function(ScenariosModel){
  return {
    templateUrl: 'app/private/scenarist/scenarios/directives.tmpl/index.html',
    controller : function($scope, $rootScope, Flash) {
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
                ScenariosModel.archiveScenario(scenario).then(function (response) {
                    if (response.isErroneous()) {
                        response.flash();
                    } else {
                        ctrl.updateScenarios();
                    }
                });
            }
        };
        ctrl.createScenario = function (name, basedOn) {
            if (name === "") {
                Flash('danger', 'Le nom ne peut pas être vide');
                return;
            } else if (basedOn === undefined) {
                Flash('danger', 'Il faut choisir un scenario de base');
                return
            }

            ScenariosModel.createScenario(name, basedOn).then(function(response) {
                if (!response.isErroneous()) {
                    $scope.scenarios.push(response.data);
                    ctrl.updateScenarios();
                } else {
                    response.flash();
                }
            });
        }
    }
};
})

.directive('scenaristScenarioCreate', function(ScenariosModel) {
  return {
    templateUrl: 'app/private/scenarist/scenarios/directives.tmpl/create.html',
    scope: false,
    require: "^scenaristScenariosIndex",
    link : function(scope, element, attrs, parentCtrl) {
        scope.newScenario = {
            name : "",
            basedOn: parentCtrl.scenarios
        };
        scope.$watch(function() {
                return scope.scenarios;
            }  , function(n,o) {
            scope.newScenario.basedOn = n;
        });
        scope.createScenario = function() {
            parentCtrl.createScenario(scope.newScenario.name, scope.newScenario.basedOn.id);
        };
    }
};
})
.directive('scenaristScenariosList', function(ScenariosModel) {
  return {
    templateUrl: 'app/private/scenarist/scenarios/directives.tmpl/list.html',
    scope: false,
    require: "^scenaristScenariosIndex",
    link : function($scope, element, attrs, parentCtrl) {
        $scope.visibleScenarios = [];
        $scope.myScenarios = [];
        $scope.scenariosLoaded = false;
        $scope.busy = false;
        $scope.search = '';

        $scope.filter = function () {
            if ($scope.search == '') {
                $scope.visibleScenarios = [];
                $scope.loadMore();
            } else if ($scope.search == '*') {
                $scope.visibleScenarios = $scope.myScenarios;
            } else {
                $scope.visibleScenarios = _.filter($scope.myScenarios, function(s) {
                    return s.name.toLowerCase().indexOf($scope.search.toLowerCase()) > -1;
                });

            }
        }
        $scope.loadMore = function() {
            if ($scope.busy || $scope.search != '' || $scope.myScenarios.length == 0) return;
            $scope.busy = true;
            var last = $scope.visibleScenarios.length;
            var minlength = Math.min($scope.myScenarios.length, 13);
            for(var i = last; i < last + minlength; i++) {
                $scope.visibleScenarios.push($scope.myScenarios[i]);
            }
            $scope.busy = false;
        };

        $scope.$watch(function() {
                return $scope.scenarios;
            }, function(newScenario, oldScenario){
            if (newScenario !== undefined && newScenario.length > 0) {
                $scope.scenariosLoaded = true;
                $scope.visibleScenarios = [];
                $scope.myScenarios = newScenario;
                $scope.filter();
            }
        });
    }
};
})
.directive('scenarioCard', function() {
    return {
        templateUrl: 'app/private/scenarist/scenarios/directives.tmpl/card.html',
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