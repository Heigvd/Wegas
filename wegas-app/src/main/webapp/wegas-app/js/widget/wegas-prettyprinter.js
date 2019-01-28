/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author maxence
 */
YUI.add("wegas-prettyprinter", function(Y) {
    "use strict";

    var AbstractPrettyPrinter;

    AbstractPrettyPrinter = Y.Base.create("wegas-prettyprinter-abstract", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        bindUI: function() {
            this.get("contentBox").delegate("click", this.toPdf, ".print-icon", this);
        },
        renderUI: function() {
            var mode = this.get("displayMode"),
                cb = this.get("contentBox");
            this.html = this.generateHTML();

            if (mode === "plain" || mode === "both") {
                cb.append("<div class=\"wegas-prettyprinter__content\">" + this.html + "</div>");
            }

            if (mode === "icon" || mode === "both") {
                cb.append("<div class='wegas-click wegas-icon-pdf print-icon' title=\"" + this.get("outputType") + "\"></div>");
            }

        },
        go: function(theVar, level) {
            var output, i, items, l;

            l = level || 0;

            if (theVar.get("@class") === this.constructor.PRETTYPRINT) {
                return this.generateOutput(theVar);
            } else if (theVar.isAugmentedBy && theVar.isAugmentedBy(Y.Wegas.persistence.VariableContainer)) {
                output = this.newFolderStart(theVar, l);
                items = theVar.get("items");
                for (i in items) {
                    output += this.go(items[i], l + 1);
                }
                output += this.newFolderEnd(theVar, l);
                return output;
            } else {
                return this.generateOutput(theVar);
            }
        },
        newFolderStart: function(theVar, level) {
            return "<span class=\"wegas-pdf-title\">" + I18n.t(theVar.get("label")) + "</span>";
        },
        newFolderEnd: function(theVar, level) {
            return "</div>";
        },
        generateHTML: function() {
            return this.go(this.get("variable.evaluated"));
        },
        generateOutput: function(theVar) {
            return "<div>Not yet implemented (\"" + I18n.t(theVar.get("label")) + "\")</div>";
        },
        toPdf: function() {
            var pdfLink = Y.Wegas.app.get("base") + "print.html";
            this.post(pdfLink, {"title": this.toEntities(this.title || Y.Wegas.Facade.Game.cache.getCurrentGame().get("name") + " / " + Y.Wegas.Facade.Game.cache.getCurrentTeam().get("name")), "body": this.toEntities(this.html), "outputType": this.get("outputType")});
        },
        /*
         ** Opens a new tab where the given data is posted:
         */
        post: function(url, postData) {
            var tabWindowId = window.open('about:blank', '_blank');
            tabWindowId.document.title = postData.title;
            var form = tabWindowId.document.createElement("form");
            form.setAttribute("method", "post");
            form.setAttribute("action", url);

            for (var key in postData) {
                if (postData.hasOwnProperty(key)) {
                    var hiddenField = tabWindowId.document.createElement("input");
                    hiddenField.setAttribute("type", "hidden");
                    hiddenField.setAttribute("name", key);
                    hiddenField.setAttribute("value", postData[key]);
                    form.appendChild(hiddenField);
                }
            }
            // var btn = tabWindowId.document.createElement("button"); btn.appendChild(tabWindowId.document.createTextNode("SUBMIT")); form.appendChild(btn);
            tabWindowId.document.body.appendChild(form);
            form.submit();
        },
        // Convert characters to HTML entities to protect against encoding issues:
        toEntities: function(text) {
            return text.replace(/[\u00A0-\u2666]/g, function(c) {
                return '&#' + c.charCodeAt(0) + ';';
            });
        }
    }, {
        EDITORNAME: "Abstract PrettyPrinter",
        ATTRS: {
            displayMode: {
                type: "string",
                value: "icon", // icon, plain, or both 
                view: {
                    type: "select",
                    choices: ["icon", "plain", "both"],
                    label: "Display "
                }
            },
            outputType: {
                type: "string",
                value: "pdf",
                view: {
                    type: "select",
                    choices: ["pdf", "html"],
                    label: "Format "
                }
            },
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: "variableselect",
                    label: "Variable"
                }
            }
        }
    });
    Y.Wegas.AbstractPrettyPrinter = AbstractPrettyPrinter;


    var TextPrettyPrinter = Y.Base.create("wegas-prettyprinter-text", Y.Wegas.AbstractPrettyPrinter, [], {
        newFolderStart: function(theVar, level) {
            return "";
        },
        newFolderEnd: function(theVar, level) {
            return "";
        },
        generateOutput: function(theVar) {
            var output = "", instance;

            instance = theVar.getInstance();

            output = "<div style='padding-bottom: 10px;'>";

            output += instance.get("value").replace(
                new RegExp('data-file="([^"]*)"', 'gi'),
                `src="${Y.Wegas.Facade.File.getPath()}$1"
             href="${Y.Wegas.Facade.File.getPath()}$1"`
                ); // @hack Place both href and src so it

            output += "</div>";

            return output;
        }
    }, {
        EDITORNAME: "Text PrettyPrinter",
        PRETTYPRINT: "TextDescriptor",
        ATTRS: {
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "object",
                view: {
                    type: "variableselect",
                    label: "Variable",
                    classFilter: ["TextDescriptor", "ListDescriptor"]
                }
            }
        }
    });
    Y.Wegas.TextPrettyPrinter = TextPrettyPrinter;
});
