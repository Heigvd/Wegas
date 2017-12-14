/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author maxcence
 */
YUI.add("wegas-prettyprinter", function(Y) {
    "use strict";

    var AbstractPrettyPrinter,
        ResourcePrettyPrinter,
        TaskPrettyPrinter;

    /**
     * Generate self styled html
     */
    AbstractPrettyPrinter = Y.Base.create("wegas-prettyprinter-abstract", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        bindUI: function() {
            this.get("contentBox").delegate("click", this.toPdf, ".toPdfButton", this);
        },
        renderUI: function() {
            this.html = this.generateHTML();
            this.get("contentBox").setContent("<div class='toPdfButton'>PDF</div>" + this.html);
        },
        go: function(theVar) {
            var output, i, items;

            if (theVar.get("@class") === this.constructor.PRETTYPRINT) {
                return this.generateOutput(theVar);
            } else if (theVar.isAugmentedBy && theVar.isAugmentedBy(Y.Wegas.persistence.VariableContainer)) {
                output = "<div><h1>" + theVar.get("label") + "</h1>";
                items = theVar.get("items");
                for (i in items) {
                    output += this.go(items[i]);
                }
                output += "</div>";
                return output;
            }
        },
        generateHTML: function() {
            return this.go(this.get("variable.evaluated"));
        },
        generateOutput: function(theVar) {
            return "<div>Not yet implemented (\"" + (theVar.get("label")) + "\")</div>";
        },
        toPdf: function() {
            var pdfLink = Y.Wegas.app.get("base") + "print.html";
            this.post(pdfLink, {"title": this.toEntities(this.title || Y.Wegas.Facade.Game.cache.getCurrentGame().get("name") + " t " + Y.Wegas.Facade.Game.cache.getCurrentTeam().get("name")), "body": this.toEntities(this.html), "outputType": "pdf"});
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
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable"
                }
            },
            theType: {
                type: "string",
                value: undefined
            }
        }
    });

    Y.Wegas.AbstractPrettyPrinter = AbstractPrettyPrinter;

    ResourcePrettyPrinter = Y.Base.create("wegas-prettyprinter-resource", Y.Wegas.AbstractPrettyPrinter, [], {
        generateOutput: function(theVar) {
            var output, instance, level;

            instance = theVar.getInstance();

            if (instance.get("active")) {
                output = "<div>";
                output += "<span style=\"font-weight: bolder;\">" + theVar.get("label") + "</span>";
                level = +instance.get("properties.level");
                if (level < 4) {
                    level = Y.Wegas.I18n.t("pmg.grade.apprentice");
                } else if (level < 7) {
                    level = Y.Wegas.I18n.t("pmg.grade.junior");
                } else if (level < 10) {
                    level = Y.Wegas.I18n.t("pmg.grade.senior");
                } else {
                    level = Y.Wegas.I18n.t("pmg.grade.expert");
                }
                output += ", " + level + "";
                output += ", " + instance.get("properties.activityRate") + "%";
                output += ", " + Y.Wegas.I18n.t("pmg.resources.wages") + " " + instance.get("properties.wage");
                output += "</div>";
            }

            return output;
        }
    }, {
        EDITORNAME: "Resource PrettyPrinter",
        PRETTYPRINT: "ResourceDescriptor",
        ATTRS: {
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable",
                    classFilter: ["ListDescriptor", "ResourceDescriptor"]
                }
            }
        }
    });
    Y.Wegas.ResourcePrettyPrinter = ResourcePrettyPrinter;

    TaskPrettyPrinter = Y.Base.create("wegas-prettyprinter-task", Y.Wegas.AbstractPrettyPrinter, [], {
        generateOutput: function(theVar) {
            var output = "", instance;

            instance = theVar.getInstance();

            if (instance.get("active")) {
                output = "<div style='padding-bottom: 10px;'>";
                output += "<h3>" + theVar.get("label") + "</h3>";
                output += "<p>" + theVar.get("description") + "</p>";
                output += "<p><b>" + Y.Wegas.I18n.t("pmg.tasks.estimatedDuration_noBr").colonize() + "</b>" + instance.get("properties.duration") + "</p>";
                output += "<p><b>" + Y.Wegas.I18n.t("pmg.tasks.fixedCosts").colonize() + "</b>" + instance.get("properties.fixedCosts") + "</p>";
                output += "</div>";
            }

            return output;
        }
    }, {
        EDITORNAME: "Task PrettyPrinter",
        PRETTYPRINT: "TaskDescriptor",
        ATTRS: {
            theType: {
                type: "string",
                value: "TaskDescriptor"
            },
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable",
                    classFilter: ["ListDescriptor", "TaskDescriptor"]
                }
            }
        }
    });
    Y.Wegas.TaskPrettyPrinter = TaskPrettyPrinter;
});
