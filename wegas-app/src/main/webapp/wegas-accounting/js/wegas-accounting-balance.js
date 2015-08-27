/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */


/*global YUI*/

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
        isValidField: function(value) {
            return /^[+-]?\d+$/.test(value);
        },
        bindUI: function() {
            this.updateHandler =
                Wegas.Facade.Variable.after("update", this.syncUI, this);

            this.changeHandler = Y.one(".wegas-balance").delegate("change", function(e) {
                var val = Y.Lang.trim(e.target.get("value"));
                val = (val === "") ? "0" : val;
                e.target.removeClass("invalid");
                if (this.isValidField(val)) {
                    val = parseInt(val, 10);
                    e.target.set("value", val);
                    this.request(e.target.get("name"), val);
                } else {
                    e.target.addClass("invalid");
                }
            }, ".wegas-balance-input", this);
        },
        syncUI: function() {
            var root = this.get("variable.evaluated"),
                balance;
            if (root && root.get("@class") === "ListDescriptor") {
                if (root.size() >= 2) {
                    balance = this.generateBalance(root.item(0), root.item(1));
                    this.syncBalance(balance);
                }
            }
        },
        renderUI: function() {
            var root = this.get("variable.evaluated"),
                balance;
            if (root && root.get("@class") === "ListDescriptor") {
                if (root.size() >= 2) {
                    balance = this.generateBalance(root.item(0), root.item(1));
                    this.renderBalance(balance);
                } else {
                    /* Usage:
                     * Rootdir:
                     *  - assets
                     *  - liabilities
                     */
                }
            } else {
                // INVALID ROOT
            }
        },
        destructor: function() {
            this.updateHandler.detach();
            this.changeHandler.detach();
        },
        generateBalance: function(assetsDir, liabilitiesDir) {
            return {
                "assets": this.sumDirectory(assetsDir),
                "liabilities": this.sumDirectory(liabilitiesDir)
            };
        },
        renderCategory: function(category) {
            var html, i, klass, editionEnabled;

            klass = "wegas-balance-" + (category.editable ? "item" : "category");

            editionEnabled = category.editable && (!this.get("userEditable.evaluated") || this.get("userEditable.evaluated").getValue());

            html = "<div class=\"" + klass + "\">"
                + "<div class=\"wegas-balance-title\"><span>" + category.label + "</span></div>";

            if (editionEnabled) {
                html += "<input class='wegas-balance-input wegas-balance-amount' "
                    + " name='" + category.name + "' "
                    + " value='" + category.amount + "'></input>";
            } else {

                html += "<div class=\"wegas-balance-amount\"><span>" + category.amount + "</span></div>";
            }

            if (category.children.length > 0) {
                html += "<div class=\"wegas-balance-category-items\">";
                for (i = 0; i < category.children.length; i += 1) {
                    html += this.renderCategory(category.children[i]);
                }
                html += "</div>";
            }
            html += "</div>";
            return html;
        },
        syncCategory: function(container, category) {
            var i, input = container.one("input[name='" + category.name + "']");
            if (input) {
                if (Math.abs(input.get("value") - category.amount) > 0.0001) {
                    input.setValue(category.amount);
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
            var contentDiv = Y.one(".wegas-balance-contents " + aKlass),
                sumDiv = Y.one(".wegas-balance-sums " + aKlass);

            for (i = 0; i < category.children.length; i += 1) {
                this.syncCategory(contentDiv, category.children[i]);
            }
            sumDiv.setContent("<div class=\"wegas-balance-amount\"><span>" + category.amount + "</span></div>");
        },
        renderColumn: function(category, aKlass) {
            var i;
            var titleDiv = Y.one(".wegas-balance-titles " + aKlass),
                contentDiv = Y.one(".wegas-balance-contents " + aKlass),
                sumDiv = Y.one(".wegas-balance-sums " + aKlass);

            titleDiv.setContent("<div class=\"wegas-balance-title\"><span>" + category.label + "</span></div>");
            contentDiv.setContent("");
            for (i = 0; i < category.children.length; i += 1) {
                contentDiv.append(this.renderCategory(category.children[i]));
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
        renderBalance: function(balance) {
            var aKlass, lKlass;
            aKlass = ".wegas-balance-assets";
            lKlass = ".wegas-balance-liabilities";
            this.renderColumn(balance.assets, aKlass);
            this.renderColumn(balance.liabilities, lKlass);
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
                                "label": item.get("label"),
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
                "label": directory.get("label"),
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
                        content: "Variable.findByName(gameModel, '" + name + "').getInstance(self).setValue(" + value + ");"
                    }
                }
            });
        }
    }, {
        ATTRS: {
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "balance sheet",
                    classFilter: ["ListDescriptor"]
                }
            },
            cDepth: {
                type: "number",
                value: 2,
                _inputex: {
                    label: "Depth"
                }
            },
            userEditable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                optional: true,
                _inputex: {
                    _type: "variableselect",
                    label: "Editable",
                    classFilter: ["BooleanDescriptor"]
                }
            }
        }
    });
    Wegas.BalanceSheet = BalanceSheet;
});