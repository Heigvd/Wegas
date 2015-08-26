/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global YUI*/
YUI.add("wegas-pmg-abstractpert", function(Y) {
    "use strict";

    var Wegas = Y.Wegas, AbstractPert;

    /**
     *  @class abstract plugin for pert-based plugin
     *  @name Y.Plugin.AbstractPert
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    AbstractPert = Y.Base.create("wegas-pmg-abstractpert", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.AbstractPert */
        _plannedPeriods: function(taskInstance) {
            return taskInstance.getPlannedPeriods();
        },
        timeSolde: function(taskDesc) {
            taskDesc.get("instance").getRemainingTime();
        },
        startPlannif: function(taskDesc) {
            return taskDesc.get("instance").getFirstPlannedPeriod();
        },

    }, {
        NS: "abstractpert",
        NAME: "abstractpert"
    });
    Y.Plugin.AbstractPert = AbstractPert;
});
