/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-proggame-scriptfiles', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox', ScriptFiles, Wegas = Y.Wegas;
    /**
     *  @class Display the proggame files
     *  @name Y.Plugin.ScriptFiles
     *  @extends Y.Widget
     *  @constructor
     */
    ScriptFiles = Y.Base.create("wegas-proggame-scriptfiles", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div><div class='buttons'></div><div class='fileName'></div></div>",
        initializer: function() {
            this.handlers = {};
        },
        renderUI: function() {
            this.addButton = new Wegas.Button({
                label: "Add file",
                on: {
                    click: Y.bind(this.createPanel, this)
                }
            }).render(this.get(CONTENTBOX).one(".buttons"));                     // Render add file button
        },
        bindUI: function() {
            this.handlers.sync = Wegas.Facade.Variable.after("update", this.syncUI, this);
        },
        syncUI: function() {
            Wegas.Facade.Variable.cache.getWithView(this.get('variable.evaluated').getInstance(), "Extended", {
                on: {
                    success: Y.bind(function(e) {
                        if (this.get("destroyed"))
                            return;

                        var node, i,
                            messages = e.response.entity.get("messages"),
                            fileNameDiv = this.get(CONTENTBOX).one(".fileName");

                        fileNameDiv.empty();

                        if (messages.length === 0) {
                            fileNameDiv.append("<p>No files to display</p>");
                        } else {
                            for (i = 0; i < messages.length; i++) {
                                node = Y.Node.create('<p>' + messages[i].get("subject") + '</p>');
                                node.data = messages[i];
                                fileNameDiv.append(node);

                                node.on("click", function(e) {
                                    this.fire("openFile", {file: e.target.data});
                                }, this);
                            }
                        }
                    }, this)
                }
            });
        },
        createPanel: function() {
            var panel = new Wegas.Panel({
                headerContent: 'Add a new file',
                bodyContent: '<p><input type="text" name="fileName" placeholder="File name"/></p>',
                width: 250,
                modal: true,
                render: true,
                buttons: [{
                        value: 'Add',
                        section: Y.WidgetStdMod.FOOTER,
                        action: Y.bind(function() {
                            panel.exit();
                            this.addFile(panel.getStdModNode("body").one("input").get("value"));
                        }, this)
                    }, {
                        value: 'Cancel',
                        section: Y.WidgetStdMod.FOOTER,
                        action: "exit"
                    }
                ]
            });
            return panel;
        },
        addFile: function(fileName) {
            Wegas.Facade.Variable.script.run("Variable.find(gameModel, 'files').sendMessage(self, '', '" + fileName + ".js', '', []);", {
                on: {
                    success: Y.bind(function(e) {
                        this.fire("openFile", {file: e.response.entity});
                    }, this)
                }
            });
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            this.addButton.destroy();
        }
    }, {
        ATTRS: {
            variable: {
                type: "object",
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: "variableselect",
                    label: "variable",
                    classFilter: ["InboxDescriptor"]
                }
            }
        }
    });
    Wegas.ScriptFiles = ScriptFiles;
});
