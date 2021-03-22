angular
    .module('flash', [])
    .factory('Flash', ['$rootScope', '$timeout',
        function($rootScope, $timeout) {
            "use strict";
            var messages = [];

            var emit = function() {
                $rootScope.$emit('flash:message', messages);
            };

            function strip(html) {
                var tmp = document.createElement("div");
                tmp.innerHTML = html;
                return tmp.textContent || tmp.innerText;
            }

            var addMessages = function(level, text) {
                messages = asArrayOfMessages(level, strip(text));
                emit();
                $timeout(function() {
                    removeMessages();
                }, 2000);
            };

            var removeMessages = function() {
                messages = [];
                emit();
            };

            $rootScope.$on('$locationChangeSuccess', emit);

            var asMessage = function(level, text) {
                if (!text) {
                    text = level;
                    level = 'success';
                }
                return {
                    level: level,
                    text: text
                };
            };

            var asArrayOfMessages = function(level, text) {
                if (level instanceof Array) {
                    return level.map(function(message) {
                        return message.text ? message : asMessage(message);
                    });
                }
                return text ? [{
                        level: level,
                        text: text
                    }] : [asMessage(level)];
            };

            var flash = function(level, text) {
                addMessages(level, text);
            };

            ['danger', 'warning', 'info', 'success'].forEach(function(level) {
                flash[level] = function(text) {
                    flash(level, text);
                };
            });

            return flash;
        }
    ])

    .directive('flashMessages', [
        function() {
            "use strict";
            var directive = {
                restrict: 'EA',
                replace: true,
                template: '<ol id="flash-messages"><li ng-repeat="m in messages" class="{{m.level}}">{{m.text}}</li></ol>'
            };

            directive.controller = ['$scope', '$rootScope',
                function($scope, $rootScope) {
                    $rootScope.$on('flash:message', function(_, messages) {
                        $scope.messages = messages;
                    });
                }
            ];

            return directive;
        }
    ]);
