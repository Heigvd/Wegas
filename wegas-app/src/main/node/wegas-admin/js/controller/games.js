/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global define*/
define(["ember"], function(Ember){
    "use strict";
    return Ember.ArrayController.extend({
        queryParams: ["type"],
        type: "todo"
    });
});
