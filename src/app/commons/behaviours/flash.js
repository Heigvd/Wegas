angular
.module('flash', [])
.factory('flash', ['$rootScope', '$timeout', function($rootScope, $timeout) {

  var messages = [];

  var emit = function() {
    $rootScope.$emit('flash:message', messages);
    $timeout(function() {
      messages = [];
      emit()
    }, 2500);
  };

  $rootScope.$on('$locationChangeSuccess', emit);

  var asMessage = function(level, text) {
    if (!text) {
      text = level;
      level = 'success';
    }
    return { level: level, text: text };
  };

  var asArrayOfMessages = function(level, text) {
    if (level instanceof Array) return level.map(function(message) {
      return message.text ? message : asMessage(message);
    });
      return text ? [{ level: level, text: text }] : [asMessage(level)];
    };

    var flash = function(level, text) {
      messages = asArrayOfMessages(level, text)
      emit();
    };

    ['error', 'warning', 'info', 'success'].forEach(function (level) {
      flash[level] = function (text) { flash(level, text); };
    });

    return flash;
  }])

.directive('flashMessages', [function() {
  var directive = {
    restrict: 'EA',
    replace: true ,
    template: '<ol id="flash-messages"><li ng-repeat="m in messages" class="{{m.level}}">{{m.text}}</li></ol>'
  };

  directive.controller = ['$scope', '$rootScope', function($scope, $rootScope) {
    $rootScope.$on('flash:message', function(_, messages, done) {
      $scope.messages = messages;
    });
  }];

  return directive;
}]);