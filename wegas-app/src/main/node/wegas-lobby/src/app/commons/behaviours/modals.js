angular.module('wegas.behaviours.modals', [])
    .controller('ModalsController', function ModalsController(close, $timeout) {
        "use strict";
        var modalsCtrl = this;
        modalsCtrl.opened = true;

        modalsCtrl.close = function() {
            $(document).off("keyup");
            modalsCtrl.opened = false;
            /*$timeout(function() {
                close();
            }, 0);*/
            close();

        };
    })
    .factory('WegasModalService', function($q, ModalService) {
        "use strict";
        var service = angular.copy(ModalService);
        service.displayAModal = function(options) {
            var deferred = $q.defer();
            ModalService.showModal(options).then(function(modal) {
                $(document).keyup(function(e) {
                    if (e.keyCode === 27 /* Escape */ ) {
                        modal.controller.close();
                    }
                });
                deferred.resolve(modal);
            });
            return deferred.promise;
        };
        return service;
    })
    .directive('modalWindow', function() {
        "use strict";
        return {
            transclude: true,
            scope: {
                close: '&',
                opened: "="
            },
            templateUrl: 'app/commons/behaviours/modals.tmpl.html',
            link: function(scope, elem, attrs) {
                $(elem).find(".modal").addClass(attrs.modalStyle);
            }
        };
    });
