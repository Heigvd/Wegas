/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI().add("ecc-entitychooser-pageloaderact", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox",
        CLASSES = {
            ENTITIES_LIST: "entities",
            ENTITY: "entity",
            CHOOSEN: "entity-choosen"
        };
    /**
     * List Entities inside a given folder.
     * On selection, load a page inside a given PageLoader and sets a given widget's attribute to the selected entity.
     * @constructor
     */
    Y.namespace("Wegas").EntityChooserPageloaderAction = Y.Base.create("ecc-entitychooser-pageloaderact", Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
            CONTENT_TEMPLATE: "<ul class='" + CLASSES.ENTITIES_LIST + "'></ul>",
            renderUI: function() {
                var items = this.get("variable.evaluated") ? this.get("variable.evaluated").flatten() : [],
                    i, entityBox = this.get(CONTENTBOX), length = items.length;
                    this.handlers = [];
                for (i = 0; i < length; i += 1) {
                    entityBox.append("<li class='" + CLASSES.ENTITY + "' data-name='" + items[i].get("name") + "'>" +
                                     (items[i].get("title") || items[i].get("label")) + "</li>");
                }               
            },
            bindUI: function() {               
                this.get(CONTENTBOX).delegate("click", function(e) {
                    this.detachHandlers();
                    e.target.addClass(CLASSES.CHOOSEN);
                    this.doAction(e.target.getData("name"));
                }, "." + CLASSES.ENTITY, this);               
            },
            doAction: function(entityName, update) {
                var pl = Y.Wegas.PageLoader.find(this.get("pageloader")), widget;                
                if (!pl) {
                    Y.log("No pageloader", "error");
                    return;
                }
                if ("" + this.get("page") === "" + pl.get("pageId") ||
                    (update && "" + update.page === "" + this.get("page"))) {
                    this.handlers.push(pl.after(["contentUpdated", "destroy"], function(){
                        this.detachHandlers();
                    }, this));
                    widget = Y.Widget.getByNode(pl.get("contentBox").one(this.get("widget")));
                    if (widget) {
                        widget.set(this.get("widgetATTR"), {name: entityName});
                        this.handlers.push(widget.after(this.get("widgetATTR") + "Change", function(){
                            this.detachHandlers();
                        }, this));
                    } else {
                        Y.log("Couldn't find widget", "error");
                    }
                } else {
                    pl.onceAfter("contentUpdated", Y.bind(this.doAction, this, entityName));
                    pl.set("pageId", this.get("page"));
                }
            },
            detachHandlers: function(){
                Y.Array.forEach(this.handlers, function(i){
                    i.detach();
                    this.get(CONTENTBOX).all("." + CLASSES.CHOOSEN).removeClass(CLASSES.CHOOSEN);
                }, this);
            }
        }, {
            ATTRS: {
                /**
                 * List to generate variables to choose from.
                 */
                variable: {
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    _inputex: {
                        _type: "variableselect",
                        legend: "Folder",
                        classFilter: ["ListDescriptor"]
                    }
                },
                /**
                 * pageLoader's name used to load 'page'
                 */
                pageloader: {
                    _inputex: {
                        _type: "pageloaderselect"
                    }
                },
                /**
                 * a page id to load inside 'pageloader'
                 */
                page: {
                    _inputex: {
                        _type: "pageselect"
                    }
                },
                /**
                 * a css selector (root at pageloader) to find given widget
                 */
                widget: {
                    type: "string",
                    _inputex: {
                        label: "Widget CSS selector"
                    }
                },
                /**
                 * attribute on given 'widget' to set selected variable to
                 */
                widgetATTR: {
                    value: "variable",
                    type: "string"
                }
            }
        }
    )
    ;
})
;
