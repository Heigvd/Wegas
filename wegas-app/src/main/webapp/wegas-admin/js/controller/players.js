/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/*global define*/
define(["ember"],function(Ember){
    "use strict";
    return Ember.ObjectController.extend({
        actions: {
            close: function() {
                return this.send('closeModal');
            }
        }
    });
});
