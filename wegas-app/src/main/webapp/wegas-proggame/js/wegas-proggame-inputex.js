/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-proggame-inputex', function(Y) {
    "use strict";

    var inputEx = Y.inputEx,
            Alignable = Y.Base.create("proggame-alignable", Y.Widget,
            [Y.WidgetPosition, Y.WidgetPositionAlign, Y.WidgetStack, Y.WidgetPositionConstrain]),
            TILESIZE = 32;

    /**
     * ProgGameMap field
     */
    inputEx.ProgGameMap = function(options) {
        inputEx.ProgGameMap.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.ProgGameMap, inputEx.ListField, {
        setOptions: function(options) {
            options.elementType = {
                type: "list",
                elementType: {
                    type: "proggametile"
                }
            };
            options.wrapperClassName = "inputEx-fieldWrapper wegas-inputex-proggamemap";
            inputEx.ProgGameMap.superclass.setOptions.call(this, options);
        },
        renderComponent: function() {
            inputEx.ProgGameMap.superclass.renderComponent.call(this);

            var node = new Y.Node(this.divEl),
                    addButtonNode = new Y.Node(this.addButton);                 // The add column link

            node.append("<div class=\"add-col\"><img />Add column</div>"),
                    node.one(".add-col").on("click", function(e) {
                var i;
                for (i = 0; i < this.subFields.length; i += 1) {
                    this.subFields[i].addElement();
                }
            }, this);
            addButtonNode.wrap("<div class=\"add-row\"></div>");
            addButtonNode.get("parentNode").on("click", this.onAddButton, this);
            addButtonNode.get("parentNode").append("Add row");
        },
        onAddButton: function(e) {
            e.halt();

            // Prevent adding a new field if already at maxItems
            if (Y.Lang.isNumber(this.options.maxItems) && this.subFields.length >= this.options.maxItems) {
                return;
            }

            var j, defaultValue = [],
                    mapWidth = this.subFields[0].getValue().length;

            for (j = 0; j < mapWidth; j += 1) {
                defaultValue.push({});
            }

            // Add a field with no value:
            var subFieldEl = this.addElement(defaultValue);

            // Focus on this field
            subFieldEl.focus();

            // Fire updated !
            this.fireUpdatedEvt();
        }
    });
    inputEx.registerType("proggamemap", inputEx.ProgGameMap);                  // Register this class as "proggamemap" type

    /**
     * ProgGameTile field
     */
    inputEx.ProgGameTile = function(options) {
        inputEx.ProgGameTile.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.ProgGameTile, inputEx.Field, {
        setValue: function(value, sendUpdatedEvent) {
            inputEx.ProgGameTile.superclass.setValue.call(this, value, sendUpdatedEvent);
            this.options.value = value;
            if (!value.x)
                return;

            this.node.setStyles({
                backgroundPositionX: "-" + (value.x * TILESIZE) + "px",
                backgroundPositionY: "-" + ((value.y) * TILESIZE) + "px"
            });
        },
        getValue: function() {
            return this.options.value;
        },
        renderComponent: function() {
            this.node = Y.Node.create("<div class=\"inputex-proggametile\"><div></div></div>");
            //this.node.setStyles({
            //      background-position:
            //});
            this.node.after("click", function() {
                if (!this.alignable) {
                    var i, j;

                    this.alignable = new Alignable({
                        align: {
                            node: this.node,
                            points: ["tl", "bl"]
                        },
                        constrain: true,
                        zIndex: 100
                    });
                    var cb = this.alignable.get("contentBox"),
                            ct = ["<div class=\"table\">"],
                            spriteSheet = Y.Wegas.ProgGameDisplay.SPRITESHEETS["t"];

                    for (i = 0; i < spriteSheet.height; i += 1) {
                        ct.push("<div>");
                        for (j = 0; j < spriteSheet.width; j += 1) {
                            ct.push("<div data-position-x=\"" + j + "\" data-position-y=\"" + i + "\" ></div>");
                        }
                        ct.push("</div>");
                    }
                    ct.push("</div>");


                    cb.set("innerHTML", ct.join(""));
                    this.alignable.render();

                    cb.delegate("click", function(e) {
                        this.setValue({
                            x: e.currentTarget.getAttribute("data-position-x"),
                            y: e.currentTarget.getAttribute("data-position-y")
                        });
                        this.alignable.hide();
                        this.outHandler.detach();
                    }, ".table div div", this);
                }

                Y.on("domready", function() {
                    this.outHandler = this.alignable.get("boundingBox").on("clickoutside", function() {
                        if (this.alignable.get("visible")) {
                            this.alignable.hide();
                            this.outHandler.detach();
                        }
                    }, this);
                }, this);
                this.alignable.show();
            }, this);
            this.fieldContainer.appendChild(this.node.getDOMNode());
        }
    });

    inputEx.registerType("proggametile", inputEx.ProgGameTile, []);             // Register this class as "proggametile" type
});
