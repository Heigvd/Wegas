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
YUI.add('wegas-pmg-tablepopup', function(Y) {
    "use strict";

    /**
     *  @class add a popup on a table column
     *  @name Y.Plugin.Tablepopup
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
            Tablepopup = Y.Base.create("wegas-pmg-tablepopup", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Tablepopup */
        menuDetails: null,
        handlers: null,
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.handlers = [];
            this.menuDetails = new Y.Wegas.Menu({
                width: this.get("width")
            });
            this.get("host").onceAfter("render", function() {
                this.bind();
                this.afterHostMethod("syncUI", this.bind);
            }, this);
        },
        bind: function() {
            var i, record, dt = this.get("host").datatable, field;

            for (i = 0; i < dt.get("data")._items.length; i++) {
                dt.getCell([i, this.get("column")]).addClass("popup");
                this.handlers.push(dt.getCell([i, this.get("column")]).on('click', function(e) {
                    dt = this.get("host").datatable;
                    field = this.get("field");
                    record = dt.getRecord(e.target);

                    this.menuDetails.set("align", {
                        node: e.target,
                        points: (e.clientX + parseInt(this.get("width")) > Y.DOM.winWidth()) ?
                                ["tr", "tl"] : ["tl", "tr"]
                    });

                    if (record.get(field)) {
                        this.display(record.get(field));
                    } else {
                        this.request(Y.Wegas.Facade.VariableDescriptor.cache.find("id", record.get("id")));
                    }
                }, this));

                this.handlers.push(dt.getCell([i, 1]).on('mouseout', function(e) {
                    this.menuDetails.hide();
                }, this));

            }
        },
        request: function(descriptor) {
            Y.Wegas.Facade.VariableDescriptor.cache.getWithView(descriptor, "Extended", {// Retrieve the object from the server in Export view
                on: Y.Wegas.superbind({
                    success: function(e) {
                        var field = this.get("field");
                        if (e.response.entity.get(field)) {
                            this.display(e.response.entity.get(field));
                        } else {
                            this.get("host").showMessage("error", "This information does not exist");
                        }

                    },
                    failure: function(e) {
                        this.get("host").showMessage("error", "An error occurs");
                    }
                }, this)
            });
        },
        display: function(value) {
            this.menuDetails.show();
            this.menuDetails.get("contentBox").setHTML('<div style="padding:5px 10px"><i>' + value + '</i></div>');
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i++) {
                this.handlers[i].detach();
            }
        }
    }, {
        ATTRS: {
            width: {
                value: "250px",
                _inputex: {
                    _type: "string",
                    label: "width"
                }
            },
            field: {
                value: "description",
                _inputex: {
                    _type: "string",
                    label: "field"
                }
            },
            column: {
                value: 1,
                _inputex: {
                    _type: "integer",
                    label: "popup on column"
                }
            }
        },
        NS: "tablepopup",
        NAME: "Tablepopup"
    });
    Y.namespace("Plugin").Tablepopup = Tablepopup;
});
