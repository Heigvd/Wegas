/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Maxence 
 */
YUI.add('wegas-bscopeinspector', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', BScopeInspector;

    BScopeInspector = Y.Base.create("wegas-bscopeinspector", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div>"
            + "<div>"
            + "<h1></h1>"
            + "<h3></h3>"
            + "</div>"
            + "<div>"
            + "<ul></ul>"
            + "</div>"
            + "</div>",
        initializer: function() {
            this.handlers = [];
        },
        renderUI: function() {
            var theVar = this.get("variable.evaluated"),
                scope = theVar.get("scopeType"),
                bScope = theVar.get("broadcastScope");


            this.get(CONTENTBOX).one("h1").setHTML(I18n.t(theVar.get("label")) + " (" + theVar.get("name") + ")");
            this.get(CONTENTBOX).one("h3").setHTML(scope + " / " + bScope + ")");
        },
        bindUI: function() {
            this.handlers.push(Y.Wegas.Facade.Instance.after("*:updatedInstance", this.instanceUpdateTrigger, this));
            this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
        },
        formatInstance: function(instance, mine) {
            if (instance) {
                if (instance === mine) {
                    return "<b>↬" + this.formatInstance(instance, null) + "</b>";
                } else {
                    this.count++;
                    return "✓" + instance.get("value");
                }
            }
            return "✗";
        },
        instanceUpdateTrigger: function(e) {
            var theVar = this.get("variable.evaluated");
            e.entity;
            this.syncUI();
        },
        syncUI: function() {

            var theVar = this.get("variable.evaluated"), i, j,
                mine = theVar.getInstance(),
                theUl = this.get(CONTENTBOX).one("ul"),
                instances = Y.Wegas.Facade.Instance.cache.find("descriptorId", theVar.get("id")).variableInstances,
                game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                team, player,
                output = "";

            this.count = 0;
            output += "<li>Global: " + this.formatInstance(instances[0], mine) + "</li>";

            output += "<ul>";
            for (i in game.get("teams")) {
                team = game.get("teams")[i];
                output += "<li>Team: " + this.formatInstance(instances[team.get("id")], mine) + "</li>";

                output += "<ul>";
                for (j in team.get("players")) {
                    player = team.get("players")[j];
                    output += "<li>Player: " + this.formatInstance(instances[player.get("id")], mine) + "</li>";
                }
                output += "</ul>";

            }
            output += "</ul>";

            output += this.count + " / " + Object.keys(instances).length;

            theUl.setHTML(output);

        },
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }
    }, {
        EDITORNAME: "BScopeInspector",
        ATTRS: {
            variable: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: "variableselect",
                    label: "Variable",
                    classFilter: ["TextDescriptor", "NumberDescriptor", "StringDescriptor"]
                }
            }
        }
    });
    Y.Wegas.BScopeInspector = BScopeInspector;
});
