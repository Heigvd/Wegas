/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
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
        },
        setupClass: function() {
            Ember.$("body").addClass("modal-open");
        }.on("init"),
        clearClass: function() {
            Ember.$("body").removeClass("modal-open");
        }.on("willDestroyElement")
    });
    Ember.Application.initializer({
        name: "modalDialog",
        initialize: function(container, application) {
            application.register("component:modal-dialog", ModalDialogComponent);
        }
    });
});
