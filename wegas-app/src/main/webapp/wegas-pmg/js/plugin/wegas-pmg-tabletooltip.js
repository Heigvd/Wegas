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
YUI.add('wegas-pmg-tabletooltip', function(Y) {
    "use strict";
    var Wegas = Y.Wegas, Tabletooltip;
    /**
     *  @class add a tooltip on a table column
     *  @name Y.Plugin.Tabletooltip
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    Tabletooltip = Y.Base.create("wegas-pmg-tabletooltip", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Tabletooltip */
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.handlers = [];
            this.detailsOverlay = new Y.Overlay({
                //srcNode: "#" + this.get("host").get("contentBox")["_node"].id, // @fixme ugly...
                zIndex: 100,
                width: this.get("width"),
                visible: false
            });
            this.shown = false;
            this.detailsOverlay.get("contentBox").addClass("pmg-popup-overlay");
            this.detailsOverlay.render();
            this.bind();
            this.onceAfterHostEvent("render", this.sync);
            this.afterHostMethod("syncUI", this.sync);
            this.get("host").datatable.after("sort", this.sync, this);
        },
        bind: function() {
            Y.log("bind()", "log", "Wegas.Tabletooltip");
            var descriptor, key,
                fields = [this.get("headerField"),
                    this.get("field"),
                    this.get("footerField")],
                dt = this.get("host").datatable;

            this.handlers.push(dt.delegate("mousemove", function(e) {
                if (this.detailsOverlay.get('visible') === false) {
                    this.detailsOverlay.show();
                    this.detailsOverlay.move(e.pageX + 10, e.pageY + 20);
                    descriptor = dt.getRecord(e.currentTarget).get("descriptor");

                    var requestedField = [];

                    for (key in fields) {
                        if (fields[key] && !descriptor.get(fields[key])) {
                            requestedField.push(fields[key]);
                        }
                    }

                    if (requestedField.length > 0) {
                        this.request(descriptor, requestedField, fields);
                    } else {
                        this.display(descriptor.get(fields[0]),
                            descriptor.get(fields[1]),
                            descriptor.get(fields[2]));
                    }
                }
            }, ".popup", this));
            //this.handlers.push(dt.delegate("mouseout", this.menuDetails.hide, ".popup", this.menuDetails));
            this.handlers.push(dt.delegate("mouseleave", function(e) {
                if ((e.relatedTarget) && (e.relatedTarget.hasClass('pmg-tabletooltip-overlay') === false)) {
                    this.detailsOverlay.hide();
                }
            }
            , ".popup", this));
        },
        sync: function() {
            var i, dt = this.get("host").datatable;
            for (i = 0; i < dt.get("data").size(); i++) {
                dt.getCell([i, this.get("column")]).addClass("popup");
            }
        },
        request: function(descriptor, requiredFields, fields) {
            if (requiredFields.length > 0) {
                Wegas.Facade.Variable.cache.getWithView(descriptor, "Extended", {// Retrieve the object from the server in Export view
                    on: Wegas.superbind({
                        success: function(e) {
                            var i, value;
                            for (i in requiredFields) {
                                value = e.response.entity.get(requiredFields[i]);
                                descriptor.set(requiredFields[i], value);
                            }
                            this.display(descriptor.get(fields[0]),
                                descriptor.get(fields[1]),
                                descriptor.get(fields[2]));
                        },
                        failure: function() {
                            this.get("host").showMessage("error", "An error occured");
                        }
                    }, this)
                });
            }
        },
        display: function(header, body, footer) {
            this.detailsOverlay.show();
            if (body) {
                this.detailsOverlay.setStdModContent('body', '<div style="padding:5px 10px"><p>' + body + '</p></div>');
            } else {
                this.detailsOverlay.setStdModContent('body', '<div style="padding:5px 10px; color: rgba(227, 66, 52, 0.48); font-style: italic; "><p>This information does not exist</p></div>');
            }
            this.detailsOverlay.set("headerContent", header);

            this.detailsOverlay.set("footerContent", footer);
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            for (var i = 0; i < this.handlers.length; i++) {
                this.handlers[i].detach();
            }
        }
    }, {
        ATTRS: {
            width: {
                type: "string",
                value: "250px"
            },
            headerField: {
                type: "string",
                value: ""
            },
            field: {
                type: "string",
                value: "description"
            },
            footerField: {
                type: "string",
                value: ""
            },
            column: {
                value: 1,
                _inputex: {
                    _type: "integer",
                    label: "popup on column"
                }
            }
        },
        NS: "tabletooltip"
    });
    Y.Plugin.Tabletooltip = Tabletooltip;
});
