/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-scheduledatatable', function(Y) {
    "use strict";

    /**
     *  @class Add column to datatable
     *  @name Y.Plugin.scheduleDT
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
            ScheduleDT = Y.Base.create("wegas-scheduledatatable", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.CSSStyles */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.get("host").onceAfter("render", function() {
                this.set("columToAdd", this.get("columnToAdd"));
//                this.get("host").datatable.delegate("click", function(e) {
//                    console.log(e.target);
//                    alert("Yes");
//                }, "tbody .scheduleColumn", this);
            }, this);
        },
        /**
         * @function
         * @private
         * @description setValue of column
         */
        setColumn: function(newval, preval) {
            var i;
            if (preval) {
                for (i = 1; i <= preval; i++) {
                    this.get("host").datatable.removeColumn(i);
                }
            }
            if (newval) {
                var table = this.get("host").datatable, i;
                for (i = 1; i <= newval; i++) {
                    table.addColumn({key: i.toString(), className : "scheduleColumn"});
                }
            }
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
        }
    }, {
        ATTRS: {
            columnToAdd: {
                setter: function(val) {
                    this.setColumn(val, this.get("columnToAdd"));
                    return val;
                },
                _inputex: {
                    _type: "integer",
                    label: "No of column"
                }
            }
        },
        NS: "ScheduleDT",
        NAME: "ScheduleDT"
    });
    Y.namespace("Plugin").ScheduleDT = ScheduleDT;
});
