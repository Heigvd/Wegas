/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/*global define*/
define(["ember", "templates/components/modal-dialog"], function(Ember) {
    "use strict";
    var ModalDialogComponent = Ember.Component.extend({
        actions: {
            close: function() {
                return this.sendAction();
            }
        }
    });
    Ember.Application.initializer({
        name: "modalDialog",
        initialize: function(container, application) {
            application.register("component:modal-dialog", ModalDialogComponent);
        }
    });
});