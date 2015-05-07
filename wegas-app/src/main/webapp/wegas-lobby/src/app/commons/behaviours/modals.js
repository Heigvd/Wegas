'use strict';
angular.module('wegas.behaviours.modals', [])
.controller('ModalsController', function ModalsController($animate, close) {
    var modalsCtrl = this;
    modalsCtrl.close = function() {
        var box = $(".modal"),
            shadow = $(".shadow");
        $animate.removeClass(shadow, "shadow--show");
        $animate.removeClass(box, "modal--open").then(function(){
            close();
        });
    };
})
;