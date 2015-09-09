/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
/*global YUI*/
YUI.add("wegas-pmg-iteration-task", function(Y) {
    "use strict";

    /**
     *  @class color occupation in datatable
     *  @name Y.Plugin.Assignment
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var CONTENTBOX = "contentBox", HOST = "host",
        Wegas = Y.Wegas, Assignment;

    Assignment = Y.Base.create("wegas-pmg-assignment", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        bind: function() {
            var table = this.get(HOST).datatable;
            this.handlers.sort = table.after("sort", this.sync, this);
            this.beforeHostMethod("syncUI", this.destroySortables);
            this.afterHostMethod("syncUI", this.sync);
        },
        sync: function() {
            this.destroySortables();
        },
        syncHost: function() {
            this.hideOverlay();
            Y.later(10, this.get("host"), this.get("host").syncUI);
        },

        destructor: function() {
            //Y.log("destructor()", "log", "Wegas.Assignment");
            Y.Object.each(this.handlers, function(h) {
                h.detach();
            });
            this.menu && this.menu.destroy();
            this.timer && this.timer.destroy();
            this.menuDetails && this.menuDetails.destroy();
            this.destroySortables();
        },
        destroySortables: function() {
            Y.Array.each(this.sortable, function(s) {
                s.destroy();
            });
            this.sortable = [];
        }
    }, {
        ATTRS: {
            taskList: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Task list"
                }
            },
            columnPosition: {
                value: 5,
                _inputex: {
                    _type: "integer",
                    label: "Column position"
                }
            }
        },
        NS: "assignment"
    });
    Y.Plugin.Assignment = Assignment;
});
