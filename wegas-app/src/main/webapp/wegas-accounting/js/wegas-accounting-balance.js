/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
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

            this.changeHandler = Y.one(".wegas-balance").delegate("change", function(e) {
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
        syncUI: function() {
            var root = this.get("variable.evaluated"),
                balance;
            if (this._editable !== this.isEditable()) {
                this.renderUI();
            }
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
            this._editable = this.isEditable();
            if (root && root.get("@class") === "ListDescriptor") {
                if (root.size() >= 2) {
                    balance = this.generateBalance(root.item(0), root.item(1));
                    this.renderBalance(balance, this._editable);
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
        isEditable: function() {
            // editable if attr not set or according to its value
            return (!this.get("userEditable.evaluated") || this.get("userEditable.evaluated").getValue());
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
            }else{
                var span = container.one(".wegas-balance-amount [data-name='" + category.name  + "'");
                if (span){
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
            var contentDiv = Y.one(".wegas-balance-contents " + aKlass),
                sumDiv = Y.one(".wegas-balance-sums " + aKlass);

            for (i = 0; i < category.children.length; i += 1) {
                this.syncCategory(contentDiv, category.children[i]);
            }
            sumDiv.setContent("<div class=\"wegas-balance-amount\"><span>" + I18n.formatNumber(category.amount) + "</span></div>");
        },
        renderColumn: function(category, aKlass, editionEnabled) {
            var i;
            var titleDiv = Y.one(".wegas-balance-titles " + aKlass),
                contentDiv = Y.one(".wegas-balance-contents " + aKlass),
                sumDiv = Y.one(".wegas-balance-sums " + aKlass);

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
});
