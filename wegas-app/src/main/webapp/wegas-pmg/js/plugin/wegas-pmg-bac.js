/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
/*global YUI*/
YUI.add('wegas-pmg-bac', function(Y) {
    "use strict";

    /**
     *  @class add Bac
     *  @name Y.Plugin.Bac
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas, Bac;

    Bac = Y.Base.create("wegas-pmg-bac", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Bac */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.onceAfterHostEvent("render", function() {
                this.get("host").datatable.addColumn({
                    key: 'bac',
                    label: Y.Wegas.I18n.t('pmg.project.bac_short'),
                    allowHTML: true,
                    formatter: function(o) {
                        return "<input class='bacField' value='" + o.data.instance.properties.bac + "'></input>";
                    }
                }, this.get("columnPosition"));
                this.bind();
                this.get("host").datatable.after("sort", this.addInputField, this);
            });
        },
        bind: function() {
            var dt = this.get("host").datatable;
            this.changeHandle = dt.delegate("change", function(e) {
                var record = dt.getRecord(e.target),
                    val = Y.Lang.trim(e.target.get("value"));
                val = (val === "") ? "0" : val;                                 // Empty is 0
                e.target.removeClass("invalid");
                if (this.isValidField(val)) {
                    val = parseInt(val, 10) + "";                               // Remove leading 0 : binary number
                    e.target.set("value", val);
                    if (record && record.get("instance").properties.bac + "" !== val) {
                        record.get("instance").properties.bac = val;
                        this.request(record);
                    }
                } else {
                    e.target.addClass("invalid");
                }
            }, ".bacField", this);
        },
        isValidField: function(value) {
            if (!/^[+]?\d+$/.test(value)) {                                     //positive number
                this.get("host").showMessage("error", "\"" + value + "\" is not a positive integer");
                return false;
            }
            return true;
        },
        request: function(taskDescriptor) {
            this.get("host").bypassSync();
            Wegas.Facade.Variable.sendQueuedRequest({
                request: "/Script/Run/" + Wegas.Facade.Game.get('currentPlayerId'),
                cfg: {
                    method: "POST",
                    //updateCache: false,
                    //updateEvent: false,
                    data: {
                        "@class": "Script",
                        //content: "Variable.findByName(self.getGameModel(), '" + taskDescriptor.get("name") + "').getInstance(self).setProperty('bac', '" + taskDescriptor.get("instance").properties.bac + "');"
                        content: "PMGHelper.updateBAC('" + taskDescriptor.get("name") + "','" + taskDescriptor.get("instance").properties.bac + "');"
                    }
                },
                on: {
                    success: Y.bind(function() {
                        this.get("host").unbypassSync();
                    }, this),
                    failure: Y.bind(function() {
                        this.get("host").unbypassSync();
                    }, this)
                }
            });
        },
        destructor: function() {
            this.changeHandle.detach();
            this.get("host").datatable.removeColumn("bac");                     /* Time consuming */
        }
    }, {
        ATTRS: {
            columnPosition: {
                value: 2,
                _inputex: {
                    _type: "integer",
                    label: "Column position"
                }
            }
        },
        NS: "bac"
    });
    Y.Plugin.Bac = Bac;
});
