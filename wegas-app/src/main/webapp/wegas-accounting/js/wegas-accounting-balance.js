/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


/*global YUI, I18n*/

YUI.add("wegas-accounting-balance", function(Y) {
    "use strict";
    var Wegas = Y.Wegas, BalanceSheet;
    /**
     * @name Y.Wegas.BalanceSheet
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @constructor
     */
    BalanceSheet = Y.Base.create("wegas-accounting-balance", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div class=\"wegas-balance\">"
            + "<div class=\"wegas-balance-titles\">"
            + "<div class=\"wegas-balance-assets\"></div>"
            + "<div class=\"wegas-balance-liabilities\"></div>"
            + "</div>"
            + "<div class=\"wegas-balance-contents\">"
            + "<div class=\"wegas-balance-assets\"></div>"
            + "<div class=\"wegas-balance-liabilities\"></div>"
            + "</div>"
            + "<div class=\"wegas-balance-sums\">"
            + "<div class=\"wegas-balance-assets\"></div>"
            + "<div class=\"wegas-balance-liabilities\"></div>"
            + "</div>",
        initializer: function() {
        },
        bindUI: function() {
            this.updateHandler =
                Wegas.Facade.Variable.after("update", this.syncUI, this);
            this.changeHandler = this.get("contentBox").delegate("change", function(e) {
                var val = Y.Lang.trim(e.target.get("value"));
                val = (val === "") ? 0 : I18n.parseNumber(val);
                if (Y.Lang.isNumber(val)) {
                    e.target.removeClass("invalid");
                    e.target.set("value", I18n.formatNumber(val));
                    this.request(e.target.get("name"), val);
                } else {
                    e.target.addClass("invalid");
                }
            }, ".wegas-balance-input", this);
        },
        _getBalanceFolders: function() {
            var root = this.get("variable.evaluated");
            if (root && root.get("@class") === "ListDescriptor") {
                // fetch to first folder to build left and right columns
                var items = root.get("items").filter(function(item) {
                    return item.get("@class") === "ListDescriptor";
                });
                if (items && items.length >= 2) {
                    return items;
                }
            }
            return null;
        },
        syncUI: function() {
            if (this._editable !== this.isEditable()) {
                this.renderUI();
            }
            var items = this._getBalanceFolders();
            if (items) {
                var balance = this.generateBalance(items[0], items[1]);
                this.syncBalance(balance);
            }
        },
        renderUI: function() {
            var items = this._getBalanceFolders();
            this._editable = this.isEditable();
            if (items) {
                var balance = this.generateBalance(items[0], items[1]);
                this.renderBalance(balance, this._editable);
            } else {
                /* Usage:
                 * Rootdir:
                 *  - assets
                 *  - liabilities
                 */
            }
        },
        destructor: function() {
            this.updateHandler.detach();
            this.changeHandler.detach();
        },
        isEditable: function() {
            // editable if attr not set or according to its value
            return (!this.get("userEditable") || this.get("userEditable.evaluated"));
        },
        generateBalance: function(assetsDir, liabilitiesDir) {
            return {
                "assets": this.sumDirectory(assetsDir),
                "liabilities": this.sumDirectory(liabilitiesDir)
            };
        },
        renderCategory: function(category, editionEnabled) {
            var html, i, klass, localEditionEnabled;
            klass = "wegas-balance-" + (category.editable ? "item" : "category");
            localEditionEnabled = category.editable && editionEnabled;
            html = "<div class=\"" + klass + "\"><div class=\"wegas-balance-line\">"
                + "<div class=\"wegas-balance-title\"><span>" + category.label + "</span></div>";
            if (localEditionEnabled) {
                html += "<input class='wegas-balance-input wegas-balance-amount' "
                    + " name='" + category.name + "' "
                    + " value='" + I18n.formatNumber(category.amount) + "'></input>";
            } else {

                html += "<div class=\"wegas-balance-amount\"><span data-name='" + category.name + "'>" + category.amount + "</span></div>";
            }
            html += "</div>";
            if (category.children.length > 0) {
                html += "<div class=\"wegas-balance-category-items\">";
                for (i = 0; i < category.children.length; i += 1) {
                    html += this.renderCategory(category.children[i], editionEnabled);
                }
                html += "</div>";
            }
            html += "</div>";
            return html;
        },
        syncCategory: function(container, category) {
            var i, input = container.one("input[name='" + category.name + "']");
            if (input) {
                if (Math.abs(I18n.parseNumber(input.get("value")) - category.amount) > 0.0001) {
                    input.set("value", I18n.formatNumber(category.amount));
                }
            } else {
                var span = container.one(".wegas-balance-amount [data-name='" + category.name + "'");
                if (span) {
                    span.setContent(I18n.formatNumber(category.amount));
                }
            }

            if (category.children.length > 0) {
                for (i = 0; i < category.children.length; i += 1) {
                    this.syncCategory(container, category.children[i]);
                }
            }
        },
        syncColumn: function(category, aKlass) {
            var i;
            var contentDiv = this.get("contentBox").one(".wegas-balance-contents " + aKlass),
                sumDiv = this.get("contentBox").one(".wegas-balance-sums " + aKlass);
            for (i = 0; i < category.children.length; i += 1) {
                this.syncCategory(contentDiv, category.children[i]);
            }
            sumDiv.setContent("<div class=\"wegas-balance-amount\"><span>" + I18n.formatNumber(category.amount) + "</span></div>");
        },
        renderColumn: function(category, aKlass, editionEnabled) {
            var i;
            var titleDiv = this.get("contentBox").one(".wegas-balance-titles " + aKlass),
                contentDiv = this.get("contentBox").one(".wegas-balance-contents " + aKlass),
                sumDiv = this.get("contentBox").one(".wegas-balance-sums " + aKlass);
            titleDiv.setContent("<div class=\"wegas-balance-title\"><span>" + category.label + "</span></div>");
            contentDiv.setContent("");
            for (i = 0; i < category.children.length; i += 1) {
                contentDiv.append(this.renderCategory(category.children[i], editionEnabled));
            }
            sumDiv.setContent("<div class=\"wegas-balance-amount\"><span>" + category.amount + "</span></div>");
        },
        syncBalance: function(balance) {
            var aKlass, lKlass;
            aKlass = ".wegas-balance-assets";
            lKlass = ".wegas-balance-liabilities";
            this.syncColumn(balance.assets, aKlass);
            this.syncColumn(balance.liabilities, lKlass);
        },
        renderBalance: function(balance, editionEnabled) {
            var aKlass, lKlass;
            aKlass = ".wegas-balance-assets";
            lKlass = ".wegas-balance-liabilities";
            this.renderColumn(balance.assets, aKlass, editionEnabled);
            this.renderColumn(balance.liabilities, lKlass, editionEnabled);
        },
        sumDirectory: function(directory, level) {
            var sum = 0, children = [], item, child, i;
            level = level || 1;
            if (directory.get("@class") === "ListDescriptor") {
                for (i = 0; i < directory.size(); i += 1) {
                    item = directory.item(i);
                    if (item.get("@class") === "ListDescriptor") {
                        child = this.sumDirectory(item, level + 1);
                        if (child) {
                            sum += child.amount;
                            if (level <= this.get("cDepth")) {
                                children.push(child);
                            }
                        }
                    } else if (item.get("@class") === "NumberDescriptor") {
                        sum += item.getValue();
                        if (level <= this.get("cDepth")) {
                            children.push({
                                "amount": item.getValue(),
                                "label": I18n.t(item.get("label")),
                                "name": item.get("name"),
                                "editable": true,
                                "children": []
                            });
                        }
                    }
                }
            }

            return {
                "amount": sum,
                "label": I18n.t(directory.get("label")),
                "name": directory.get("name"),
                "children": children
            };
        },
        request: function(name, value) {
            Wegas.Facade.Variable.sendRequest({
                request: "/Script/Run/" + Wegas.Facade.Game.get('currentPlayerId'),
                cfg: {
                    method: "POST",
                    data: {
                        "@class": "Script",
                        content: "Variable.find(gameModel, '" + name + "').getInstance(self).setValue(" + value + ");"
                    }
                }
            });
        }
    }, {
        ATTRS: {
            variable: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                required: true,
                view: {
                    type: "variableselect",
                    label: "balance sheet",
                    classFilter: ["ListDescriptor"]
                }
            },
            cDepth: {
                type: "number",
                value: 2,
                required: true,
                view: {
                    label: "Depth"
                }
            },
            userEditable: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: "variableselect",
                    label: "Editable",
                    classFilter: ["BooleanDescriptor"]
                }
            }
        }
    });
    Wegas.BalanceSheet = BalanceSheet;

    var BalanceSheetWrapper = Y.Base.create("wegas-accounting-balance-wrapper", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        //structure: {
        //    // tag: variable
        //    face2Face: boolean,
        //    balanceSheet: rootFolder,
        //    editable: boolean,
        //    //showValidateButton: boolean
        //},
        //balanceSheet: {
        //    assets: folder,
        //    liabilities: foler,
        //    hint: textDesc,
        //    hintVisible: booleanDesc
        //},
        getData: function() {
            var folder = this.get("variable.evaluated");
            return {
                root: folder,
                editable: folder.getChildByTag('editable'),
                balanceSheets: folder.get("items").filter(function(item) {
                    return item.get("@class") === "ListDescriptor";
                })
            };
        },

        initializer: function() {
            this.handlers = {};
        },
        destructor: function() {
            for (var k in this.handlers) {
                if (this.handlers.hasOwnProperty(k)) {
                    this.handlers[k].detach();
                }
            }
        },
        bindUI: function() {
            this.handlers.onVariableChange = this.after("variableChange", this.afterChange, this);
        },
        afterChange: function() {
            this.renderUI();
        },
        renderUI: function() {
            this.destroyAll();
            var data = this.getData();
            this.add(new Y.Wegas.Text({
                content: data.root.getLabel(),
                cssClass: 'wegas-accounting-balance-wrapper--title',
                editable: false
            }));

            this.list = new Y.Wegas.FlexList({
                cssClass: 'wegas-accounting-balance-wrapper--list',
                direction: 'horizontal',
                editable: false
            });
            this.balanceSheets = [];

            var userEditable = {
                "@class": "Script"
            };
            var disabled = {
                "@class": "Script"
            };

            if (data.editable) {
                userEditable.content = "Variable.find(gameModel, \"" + data.editable.get("name") + "\").getValue();";
                disabled.content = "!Variable.find(gameModel, \"" + data.editable.get("name") + "\").getValue();";
            } else {
                userEditable.content = "true";
                disabled.content = "false";
            }

            for (var i in data.balanceSheets) {
                var balanceSheet = data.balanceSheets[i];
                var container = new Y.Wegas.FlexList({
                    cssClass: 'wegas-accounting-balance-wrapper--item',
                    direction: 'vertical'
                });

                container.add(new Y.Wegas.Text({
                    content: balanceSheet.getLabel(),
                    cssClass: 'wegas-accounting-balance-wrapper--item-title'
                }));

                container.add(new Y.Wegas.BalanceSheet({
                    variable: {
                        "@class": "Script",
                        "content": "Variable.find(gameModel, \"" + balanceSheet.get("name") + "\");"
                    },
                    userEditable: userEditable
                }));
                this.balanceSheets.push(container);
                var hint = balanceSheet.getChildByTag('hint');
                if (hint) {
                    var hintVisible = balanceSheet.getChildByTag('hintVisible');
                    var hidden = {
                        "@class": "Script"
                    };
                    if (hintVisible) {
                        hidden.content = "!Variable.find(gameModel, \"" + hintVisible.get("name") + "\").getValue();"
                    } else {
                        hidden = "false";
                    }
                    container.add(new Y.Wegas.TextTemplate({
                        cssClass: 'wegas-accounting-balance-wrapper--hint',
                        "plugins": [
                            {
                                "fn": "ConditionalDisable",
                                "cfg": {
                                    "condition": hidden,
                                    "attribute": "cssClass",
                                    "value": "hidden"
                                }
                            }
                        ],
                        variable: {
                            "@class": "Script",
                            "content": "Variable.find(gameModel, \"" + hint.get("name") + "\");"
                        }
                    }));
                }
                this.list.add(container);
            }

            this.add(this.list);

            this.validateButton = new Y.Wegas.Button({
                editable: false,
                cssClass: 'wegas-accounting-balance-wrapper--validate',
                label: "Valider",
                plugins: [{
                        "fn": "ExecuteScriptAction",
                        "cfg": {
                            "targetEvent": "click",
                            "onClick": {
                                "@class": "Script",
                                "content": "Event.fire(\"bilanSubmit_" + data.root.get("name") + "\");"
                            }
                        }
                    }, {
                        "fn": "ConditionalDisable",
                        "cfg": {
                            "condition": disabled,
                            "attribute": "cssClass",
                            "value": "hidden"
                        }
                    }
                ]}
            );
            this.add(this.validateButton);
        },
        syncUI: function() {
        }
    }, {
        ATTRS: {
            variable: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                required: true,
                view: {
                    type: "variableselect",
                    label: "balance sheet",
                    classFilter: ["ListDescriptor"]
                }
            }
        }
    });

    Wegas.BalanceSheetWrapper = BalanceSheetWrapper;
});
