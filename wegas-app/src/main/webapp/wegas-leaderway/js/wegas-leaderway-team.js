/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-leaderway-team', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Wegas = Y.Wegas, LeaderwayTeam;

    LeaderwayTeam = Y.Base.create("leaderway-team", Wegas.ItemSelector, [], {
        CONTENT_TEMPLATE: '<div><div class="selectors"></div><div class="main"><div class="informations"></div><div class="buttons"></div><div style="clear:both"></div></div></div>',
        renderUI: function() {
            LeaderwayTeam.superclass.renderUI.apply(this);

            this.on("informationsRender", function() {
                var cb = this.get(CONTENTBOX);
                // Remove all "previous" node with "leadershiplevel < 1"
                this.get(CONTENTBOX).all('.nodeformatter-position *').each(function(n) {
                    if (n.getAttribute('data-position') < 0 && n.get('className') === 'previous') {
                        n.remove(true);
                    }
                });

                cb.one(".buttons").empty();

                Y.Array.each(this.findDialogues(this.currentItem), function(vd) {
                    new Wegas.Button({
                        label: vd.get("title") || vd.get("label"),
                        on: {
                            click: Y.bind(this.showDialogue, this, vd)
                        }
                    }).render(cb.one(".buttons"));
                }, this);
            });
        },
        syncUI: function() {
            LeaderwayTeam.superclass.syncUI.apply(this);
            var cb = this.get(CONTENTBOX);
            if (this.panel && !this.panel.get("destroyed")) {
                var dialogue = Wegas.Facade.Variable.cache.findById(this.currentDialogue.get("id")).getInstance(); // Force cache refresh
                if (!dialogue.get("enabled")) {
                    this.panel.destroy();
                    this.panel = null;
                } else {
                    this.panel.get(CONTENTBOX).one(".leaderway-team-picture")
                        .setContent('<img data-file="' + this.currentItem.getInstance().get("properties.picture") + '" />');
                }
            }
            cb.all(".leaderway-team-talk").remove(true);
            cb.all(".selector").each(function(s) {
                if (this.findDialogues(s.variable).length > 0) {
                    s.append("<div class='leaderway-team-talk'></div>");
                }
            }, this);
        },
        findVariables: function() {
            if (!this.get('listVariables'))
                return;

            var variables = Wegas.Facade.Variable.cache.find("name", this.get('listVariables'));
            if (!variables || !variables.get('items') || variables.get('items').length <= 0)
                return;

            variables = Y.Array.map(variables.get('items'), function(employeeFolder) {
                return employeeFolder instanceof Wegas.persistence.ListDescriptor &&
                    Y.Array.find(employeeFolder.get('items'), function(vd) {
                        return vd instanceof Wegas.persistence.ResourceDescriptor;
                    });
            });

            return  Y.Array.filter(variables, function(vd) {
                return vd && vd.getInstance().get("active") !== false;
            });
        },
        findDialogues: function(variable) {
            return Y.Array.filter(variable.parentDescriptor.get("items"), function(vd) {
                return vd instanceof Wegas.persistence.DialogueDescriptor
                    && vd.getInstance().get("enabled");
            }, this);
        },
        showDialogue: function(dialogue) {
            var panel = new Wegas.Panel({
                bodyContent: '<div class=\"leaderway-team-picture\"><img data-file="' + this.currentItem.getInstance().get("properties.picture") + '" /></div>',
                modal: true,
                width: 980,
                height: 400,
                cssClass: "leaderway-team-panel",
                buttons: {
                    header: [{
                            name: 'proceed',
                            label: 'x',
                            action: "exit"
                        }]
                }
            }).render();

            panel.get("boundingBox").addClass("leaderway-team-panel");
            panel.plug(Y.Plugin.Injector);

            new Wegas.SimpleDialogue({
                dialogueVariable: {
                    content: "Variable.find('" + dialogue.get("name") + "')"
                }
            }).render(panel.getStdModNode("body", true));
            this.currentDialogue = dialogue;
            this.panel = panel;
        }
    });
    Wegas.LeaderwayTeam = LeaderwayTeam;
});
