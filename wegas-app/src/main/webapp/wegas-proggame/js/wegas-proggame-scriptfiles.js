/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-proggame-scriptfiles', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox';
    /**
     *  @class Display the proggame files
     *  @name Y.Plugin.ScriptFiles
     *  @extends Y.Widget
     *  @constructor
     */
    var ScriptFiles = Y.Base.create("wegas-proggame-scriptfiles", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        handlers: null,
        initializer: function() {
            this.handlers = {};
            this.createPanel();

            Y.publish('openFile', {
                broadcast: 2
            });
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            this.addButton = new Y.Wegas.Button({
                label: "Add file"
            });
            this.addButton.render(cb);
            cb.append("<div class='fileName'></div>");

            this.createPanel();
        },
        bindUI: function() {
            this.handlers.sync = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);

            this.addButton.on("click", function(e) {
                this.newFilePanel.show();
            }, this);
        },
        syncUI: function() {
            var inboxDescriptor = this.get('variable.evaluated'),
                    messages = inboxDescriptor.getInstance().get("messages"), node,
                    cb = this.get(CONTENTBOX), fileNameDiv = cb.one(".fileName"), i;

            fileNameDiv.get('childNodes').remove();

            if (messages.length === 0) {
                fileNameDiv.append("<p>No files to display</p>");
            } else {
                for (i = 0; i < messages.length; i++) {
                    node = Y.Node.create('<p>' + messages[i].get("subject") + '</p>');
                    node.data = messages[i];
                    fileNameDiv.append(node);

                    node.on("click", function(e) {
                        this.fire("openFile", node.data);
                        console.log("openFile event");
                    }, this);
                }
            }
        },
        createPanel: function() {
            var node = Y.Node.create('<p><input type="text" name="fileName" placeholder="File name"/></p>'), that = this;
            this.newFilePanel = new Y.Wegas.Panel({
                srcNode: node,
                headerContent: 'Add a new file',
                width: 250,
                centered: true,
                visible: false,
                render: true,
                buttons: [
                    {
                        value: 'Add',
                        section: Y.WidgetStdMod.FOOTER,
                        action: function(e) {
                            e.preventDefault();
                            this.hide();
                            that.addFile(this.get("srcNode").one("input").get("value"));
                            this.get("srcNode").one("input").set("value", "");
                        }
                    },
                    {
                        value: 'Cancel',
                        section: Y.WidgetStdMod.FOOTER,
                        action: function(e) {
                            e.preventDefault();
                            this.hide();
                        }
                    }
                ]
            });
        },
        addFile: function(fileName) {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                'Managed-Mode': 'false',
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);\nVariableDescriptorFacade.find(gameModel, 'files').sendMessage(self, '', '" + fileName +".js', '', []);"
                    })
                },
                on: {
                    success: Y.bind(function(e) {
                        this.fire("openFile", e.response.entity);
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
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable",
                    classFilter: ["InboxDescriptor"]
                }
            }
        }
    });
    Y.namespace('Wegas').ScriptFiles = ScriptFiles;
});
