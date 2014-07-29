/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add('wegas-cep-folder', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Folder;

    Folder = Y.Base.create("wegas-cep-folder", Y.Wegas.ItemSelector, [Y.Wegas.Widget], {
        renderUI: function() {
            Folder.superclass.renderUI.apply(this);

            //remove all "previous" node with "leadershiplevel < 1"
            this.on("informationsRender", function() {
                this.get(CONTENTBOX).all('.nodeformatter-position *').each(function(n) {
                    if (n.getAttribute('data-position') < 0 && n.get('className') === 'previous') {
                        n.remove(true);
                    }
                });
                this.talkButton.set("label", "Talk to " + this.currentItem.get("title"));
                this.talkButton.set("visible", this.findDialogue());
            });

            this.talkButton = new Y.Wegas.Button();
            this.talkButton.on("click", this.showDialogue, this);
            this.talkButton.render(this.get(CONTENTBOX));
        },
        syncUI: function() {
            Folder.superclass.syncUI.apply(this);
            if (this.panel) {
                if (!Y.Wegas.Facade.Variable.cache.findById(this.currentDialogue.get("id")).getInstance().get("enabled")) {
                    this.panel.destroy();
                    this.panel = null;
                }
            }
            this.get("contentBox").all(".cep-folder-talk").remove(true);
            this.get("contentBox").all(".selector").each(function(s) {
                if (this.findDialogue(s.getAttribute("data-name"))) {
                    s.append("<div class='cep-folder-talk'></div>");
                }
            }, this);
        },
        destructor: function() {
            this.talkButton.destroy();
        },
        showDialogue: function() {
            var panel = new Y.Wegas.Panel({
                bodyContent: '<div class=\"cep-folder-picture\"><img data-file="' + this.currentItem.getInstance().get("properties.picture") + '" /></div>',
                modal: true,
                width: 980,
                height: 400,
                render: true,
                buttons: []
            }),
                    dialogueDescriptor = this.findDialogue(),
                    bodyNode = panel.getStdModNode("body", true);

            bodyNode.addClass("cep-folder-panel");
            panel.plug(Y.Plugin.Injector);

            new Y.Wegas.SimpleDialogue({
                dialogueVariable: {
                    content: "Variable.find('" + dialogueDescriptor.get("name") + "')"
                },
                render: bodyNode
            });
            this.currentDialogue = dialogueDescriptor;
            this.panel = panel;
        },
        findDialogue: function(name) {
            var vd = Y.Wegas.Facade.Variable.cache.find("name", "dialogues");

            if (!vd) {
                return false;
            }

            name = name || this.currentItem.get("label");

            return Y.Array.find(vd.get("items"), function(i) {
                return i.getInstance().get("enabled") && i.get("label").toLowerCase().indexOf(name.toLowerCase()) > -1;
            }, this);
        }
    });
    Y.Wegas.CEPFolder = Folder;
});
