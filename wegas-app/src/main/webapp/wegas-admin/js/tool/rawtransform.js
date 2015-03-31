/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/*global define*/
define(["ember", "ember-data"], function(Ember, DS) {
    "use strict";
    var Raw = DS.Transform.extend({
        deserialize: function(deserialize) {
            return deserialize;
        },
        serialize: function(serialize) {
            return serialize;
        }
    });
    Ember.Application.initializer({
        name: "rawTransform",
        initialize: function(container, application) {
            application.register("transform:raw", Raw);
        }
    });
})