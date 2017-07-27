/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-scriptlibrary', function(Y) {
    'use strict';

    var CONTENTBOX = 'contentBox',
        Wegas = Y.Wegas,
        ScriptLibrary;
    /**
     * @name Y.Wegas.ScriptLibrary
     * @class Display a script edition field, using a Y.inputEx.AceField
     * @constructor
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     */
    ScriptLibrary = Y.Base.create(
        'wegas-scriptlibrary',
        Y.Widget,
        [Y.WidgetChild, Wegas.Widget],
        {
            /** @lends Y.Wegas.ScriptLibrary# */
            CONTENT_TEMPLATE:
                '<div><div class="empty">No file found, click the "New" button to create one.</div></div>',
            /**
         * @function
         * @private
         */
            initializer: function() {
                /**
             * @field
             * @private
             */
                this.currentScriptName = null;
                /**
             * @field
             * @private
             */
                this.scripts = null;
            },
            /**
         * @function
         * @private
         */
            renderUI: function() {
                this.aceField = new Y.inputEx.AceField({
                    parentEl: this.get(CONTENTBOX),
                    type: 'ace',
                    height: '100%',
                    language:
                        this.get('library') === 'CSS' ? 'css' : 'javascript',
                    value: '',
                });

                this.renderToolbar();
            },
            /**
         * @function
         * @private
         */
            bindUI: function() {
                //this.responseHandler = Wegas.Facade.GameModel.after("update", this.syncUI, this); //don't work if two widgets in differents tabs are open (I comment this line and add "updateCache: false at each requests)

                this.selectField.on(
                    'updated',
                    function(val) {
                        this.currentScriptName = val;
                        this.syncEditor();
                    },
                    this
                );

                this.aceField.once(
                    'updated',
                    function() {
                        this.saveButton.set('disabled', false);
                    },
                    this
                );

                // sync aceField changes with local library
                this.aceField.session.on(
                    'change',
                    Y.bind(function() {
                        // Each time the ace content change
                        var libraries = this.scripts
                                ? this.scripts.get('val')
                                : {},
                            selected = this.selectField.getValue();

                        if (libraries[selected]) {
                            var newContent = this.aceField.getValue();
                            this.showMessage('success', 'Script not saved');
                            libraries[selected].content = newContent;
                        }
                    }, this)
                );

                this.get(CONTENTBOX).on('key', this.save, 'down:83+ctrl', this); // ctrl-s shortcut
            },
            /**
         * @function
         * @private
         */
            syncUI: function() {
                while (this.selectField.choicesList.length > 0) {
                    // Remove existing choices
                    this.selectField.removeChoice({
                        position: 0,
                    });
                }
                this.showOverlay();
                //get library  in current game Model (export view);
                Wegas.Facade.GameModel.sendRequest(
                    {
                        request:
                            '/' +
                            Wegas.Facade.GameModel.get('currentGameModelId') +
                            '/Library/' +
                            this.get('library') +
                            '?view=Export',
                        cfg: {
                            updateCache: false,
                        },
                        on: Wegas.superbind(
                            {
                                success: function(data) {
                                    this.scripts = data.response.entity;
                                    this.syncWithLibrary();
                                },
                                failure: function() {
                                    this.hideOverlay();
                                },
                            },
                            this
                        ),
                    },
                    this
                );
            },
            /**
         * @function
         * @private
         */
            destructor: function() {
                // this.responseHandler.detach();
                this.selectField.destroy();
                this.aceField.destroy();
                this.newButton.destroy();
                this.selectField.destroy();
                this.saveButton.destroy();
                this.deleteButton.destroy();
            },
            // *** Private Methods *** //
            syncWithLibrary: function() {
                this.syncAceField();
                this.syncEditor();
                this.hideOverlay();
            },
            /**
         *
         * @returns {undefined}
         */
            syncAceField: function() {
                var i,
                    isEmpty = true,
                    cb = this.get(CONTENTBOX),
                    libraries = this.scripts ? this.scripts.get('val') : {};
                delete libraries['@class'];
                for (i in libraries) {
                    if (!this.currentScriptName) {
                        this.currentScriptName = i;
                    }
                    this.selectField.addChoice({
                        value: i,
                    });
                    isEmpty = false;
                }

                if (isEmpty) {
                    this.selectField.addChoice({
                        value: null,
                        label: 'No scripts',
                    });
                    this.aceField.hide();
                } else {
                    this.aceField.show();
                    this.selectField.setValue(this.currentScriptName, false);
                }

                this.saveButton.set('disabled', isEmpty);
                this.deleteButton.set('disabled', isEmpty);
                cb.one('.empty').set('visible', isEmpty);

                this.hideOverlay();
            },
            /**
         * @function
         * @private
         */
            syncEditor: function() {
                var libraries = this.scripts ? this.scripts.get('val') : {},
                    selected = this.selectField.getValue(),
                    val = libraries[selected]
                        ? libraries[selected].content || ''
                        : '';

                this.aceField.setValue(val, false);
            },
            /**
         * @function
         * @private
         */
            renderToolbar: function() {
                this.plug(Y.Plugin.WidgetToolbar);

                var toolbarNode = this.toolbar.get('header');

                this.newButton = new Y.Button({
                    label: '<span class="wegas-icon wegas-icon-new"></span>New',
                    on: {
                        click: Y.bind(function() {
                            var libraries = this.scripts
                                ? this.scripts.get('val')
                                : {};
                            this.currentScriptName = prompt('Enter a name:');
                            if (this.currentScriptName == undefined) {
                                return;
                            }
                            if (
                                libraries.hasOwnProperty(this.currentScriptName)
                            ) {
                                this.showMessage(
                                    'error',
                                    'This name already exists.'
                                );
                                return;
                            }
                            this.showOverlay();

                            Wegas.Facade.GameModel.sendRequest({
                                request:
                                    '/' +
                                    Wegas.Facade.GameModel.get(
                                        'currentGameModelId'
                                    ) +
                                    '/Library/' +
                                    this.get('library') +
                                    '/' +
                                    this.currentScriptName,
                                cfg: {
                                    method: 'POST',
                                    updateCache: false,
                                    data: {
                                        '@class': 'GameModelContent',
                                    },
                                },
                                on: Wegas.superbind(
                                    {
                                        success: function() {
                                            this.showMessage(
                                                'success',
                                                'Script created',
                                                1000
                                            );
                                            this.syncUI();
                                        },
                                        failure: function() {
                                            this.showMessage(
                                                'error',
                                                'Error while saving script.'
                                            );
                                        },
                                    },
                                    this
                                ),
                            });
                        }, this),
                    },
                }).render(toolbarNode);

                this.selectField = new Y.inputEx.SelectField({
                    choices: [
                        {
                            value: null,
                            label: 'loading...',
                        },
                    ],
                    parentEl: toolbarNode,
                });

                //if (this.get("library") === "CSS") {                              // Preview button for css (will be applied on save
                //    this.previewButton = new Y.Button({
                //        label: "<span class=\"wegas-icon wegas-icon-preview\" ></span>Preview",
                //        on: {
                //            click: Y.bind(function() {
                //                this.updateStyleSheet(this.currentScriptName, this.aceField.getValue());
                //            }, this)
                //        }
                //    }).render(toolbarNode);
                //}

                this.saveButton = new Y.Button({
                    label:
                        '<span class="wegas-icon wegas-icon-save" ></span>Save',
                    on: {
                        click: Y.bind(this.save, this),
                    },
                }).render(toolbarNode);

                this.deleteButton = new Y.Button({
                    label:
                        '<span class="wegas-icon wegas-icon-delete"></span>Delete',
                    on: {
                        click: Y.bind(function() {
                            Wegas.Panel.confirm(
                                'Are you sure you want to delete the "' +
                                    this.currentScriptName +
                                    '" script ?',
                                Y.bind(function() {
                                    this.showOverlay();
                                    Wegas.Facade.GameModel.sendRequest({
                                        request:
                                            '/' +
                                            Wegas.Facade.GameModel.get(
                                                'currentGameModelId'
                                            ) +
                                            '/Library/' +
                                            this.get('library') +
                                            '/' +
                                            this.currentScriptName,
                                        cfg: {
                                            method: 'DELETE',
                                            updateCache: false,
                                        },
                                        on: Wegas.superbind(
                                            {
                                                success: function() {
                                                    this.showMessage(
                                                        'success',
                                                        'Script deleted'
                                                    );
                                                    if (
                                                        this.get('library') ===
                                                        'CSS'
                                                    ) {
                                                        this.updateStyleSheet(
                                                            this
                                                                .currentScriptName,
                                                            ''
                                                        );
                                                    }
                                                    this.currentScriptName = null;
                                                    this.syncUI();
                                                },
                                                failure: function() {
                                                    this.showMessage(
                                                        'error',
                                                        'Error while deleting script.'
                                                    );
                                                },
                                            },
                                            this
                                        ),
                                    });
                                }, this)
                            );
                        }, this),
                    },
                }).render(toolbarNode);
            },
            save: function(e) {
                e.halt(true);
                this.showOverlay();

                Wegas.Facade.GameModel.sendRequest({
                    request:
                        '/' +
                        Wegas.Facade.GameModel.get('currentGameModelId') +
                        '/Library/' +
                        this.get('library') +
                        '/' +
                        this.selectField.getValue(),
                    cfg: {
                        method: 'PUT',
                        updateCache: false,
                        data: {
                            '@class': 'GameModelContent',
                            content: this.aceField.getValue(),
                        },
                    },
                    on: Wegas.superbind(
                        {
                            success: function() {
                                this.showMessage('success', 'Script saved');
                                this.hideOverlay();

                                if (this.get('library') === 'CSS') {
                                    this.updateStyleSheet(
                                        this.currentScriptName,
                                        this.aceField.getValue()
                                    );
                                }
                                if (this.get('library') === 'ClientScript') {
                                    try {
                                        eval(this.aceField.getValue());
                                    } catch (e) {
                                        this.showMessage(
                                            'error',
                                            'This script contains errors'
                                        );
                                    }
                                }
                                //this.syncUI();
                            },
                            failure: function() {
                                this.showMessage(
                                    'error',
                                    'Error while saving script'
                                );
                            },
                        },
                        this
                    ),
                });
            },
            updateStyleSheet: function(id, content) {
                Y.Plugin.CSSLoader.updateStyleSheet(id, content);
            },
        },
        {
            ATTRS: {
                library: {
                    type: 'string',
                    value: 'Script', // Script, ClientScript or CSS
                },
            },
        }
    );
    Wegas.ScriptLibrary = ScriptLibrary;
});
