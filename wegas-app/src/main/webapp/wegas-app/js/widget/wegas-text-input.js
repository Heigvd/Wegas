/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add('wegas-text-input', function(Y) {
    'use strict';
    var CONTENTBOX = 'contentBox', TextInput, StringInput, Wegas = Y.Wegas;

    /**
     * Listen Input Event from its host and toggle cssClass to reflect underlyging inputs 
     * saving statuses.
     * @type type
     */
    var SaveStatusAggregator = Y.Base.create('SaveStatusAggregator', Y.Plugin.Base,
        [Wegas.Plugin, Wegas.Editable], {
        initializer: function() {
            this.onHostEvent("*:save", this.onSave, this);
            this.onHostEvent("*:saved", this.onSaved, this);
            this.onHostEvent("*:editing", this.onEdit, this);
            this.onHostEvent("*:revert", this.onRevert, this);

            this.locks = {};
        },
        destructor: function() {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
        },
        onEdit: function(e) {
            this.lock(e);
        },
        onSave: function(e) {
            this.lock(e);
        },
        onSaved: function(e) {
            this.unlock(e);
        },
        onRevert: function(e) {
            this.unlock(e);
        },
        _getText: function(attr, defaultValue) {
            if (this.get(attr)) {
                return this.get(attr + ".evaluated").getValue();
            } else {
                return defaultValue;
            }
        },
        lock: function(e) {
            this.locks[e.descriptor.get("name")] = true;
            this.setStatus(this._getText("editingText", "editing..."));
            this.touchWidgets(false);
        },
        unlock: function(e) {
            this.locks[e.descriptor.get("name")] = false;
            delete this.locks[e.descriptor.get("name")];
            if (!this.isLocked()) {
                // nothing locked any longer
                this.setStatus(this._getText("savedText", "saved"));
                this.touchWidgets(true);
            }
        },
        isLocked: function() {
            return Y.Array.find(Y.Object.values(this.locks), function(item) {
                return item; // a lock set to true !
            });
        },
        getAll: function(selector, callback) {
            if (selector) {
                this.get("host").get("boundingBox").all(selector).each(callback);
            }
        },
        setStatus: function(status) {
            this.getAll(this.get("statusNode"), function(node) {
                node.setContent(status);
            });
        },
        touchWidgets: function(enable) {
            this.getAll(this.get("toDisable"), function(node) {
                var widget = Y.Widget.getByNode(node);
                if (widget) {
                    if (widget._enable && widget._disable) {
                        if (enable) {
                            widget._enable('input_aggregator');
                        } else {
                            widget._disable('input_aggregator');
                        }
                    } else {
                        widget.set("disabled", enable);
                    }
                }
            });
        }
    }, {
        NS: "SaveStatusAggregator",
        NAME: "SaveStatusAggregator",
        ATTRS: {
            editingText: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                required: true,
                view: {
                    type: 'variableselect',
                    label: 'Editing text',
                    classFilter: ['StringDescriptor', 'TextDescriptor']
                }
            },
            savedText: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                required: true,
                view: {
                    type: 'variableselect',
                    label: 'Saved text',
                    classFilter: ['StringDescriptor', 'TextDescriptor']
                }
            },
            toDisable: {
                type: "string",
                value: "",
                view: {
                    label: "Node(s) to disablewhile editing/saving",
                    description: "CSS Selector from host boundingBox"
                }
            },
            statusNode: {
                type: "string",
                value: "",
                view: {
                    label: "status node",
                    description: "CSS Selector from host boundingBox"
                }
            }
        }
    });
    Y.Plugin.SaveStatusAggregator = SaveStatusAggregator;

    /**
     * @name Y.Wegas.TextInput
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class class to edit text
     * @constructor
     */
    TextInput = Y.Base.create('wegas-text-input', Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.TextInput# */

        CONTENT_TEMPLATE: '<div>' +
            '<div class="wegas-input-label"></div>' +
            '<div class="wegas-input-body">' +
            '  <div class="wegas-text-input-editor-toolbar"></div>' +
            '  <div class="wegas-text-input-editor"></div>' +
            '  <div class="wegas-text-input-toolbar">' +
            '    <span class="cc"></span>' +
            '    <span class="wc"></span>' +
            '    <span class="status"></span>' +
            '  </div>' +
            '</div>' +
            '</div>',
        initializer: function() {
            this.handlers = [];
            this.publish('saved', {
                emitFacade: true
            });
            this.publish('save', {
                emitFacade: true
            });
            this.publish('editing', {
                emitFacade: true
            });
            this.publish('stopEditing', {
                emitFacade: true
            });
        },
        /**
         * @function
         * @private
         */
        renderUI: function() {
            var CB = this.get('contentBox');
            this._descriptor = this.get('variable.evaluated');
            //            Y.once("domready", function() {
            if (this.get('label')) {
                CB.one('.wegas-input-label').setContent(this.get('label'));
            }
            if (this.get('maxNumberOfCharacters')) {
                CB.one('.wegas-text-input-editor').setAttribute('data-maxChars', this.get('maxNumberOfCharacters'));
            }

            CB.setAttribute("data-resize", this.get("resize"));

            if (this.get('readonly.evaluated')) {
                CB.one('.wegas-text-input-editor').setContent(
                    '<div class="readonly wegas-template-content">' +
                    this.getInitialContent() + '</div>');
            } else {
                Y.once('domready', function() {
                    //this.editor = new tinymce.Editor(this.get("contentBox").one(".wegas-text-input-editor").getDOMNode(),
                    if (this.editor) {
                        return;
                    }
                    var tinyCfg = {
                        //selector: this.get("contentBox").one(".wegas-text-input-editor").getDOMNode(),
                        selector: '#' +
                            this.get('contentBox').get('id') +
                            ' .wegas-text-input-editor',
                        plugins: [
                            'autolink link image lists code media table paste advlist textcolor '
                                + (this.get('contextmenu') ? "contextmenu" : "")
                                //textcolor wordcount autosave advlist charmap print preview hr anchor pagebreak spellchecker directionality
                        ],
                        external_plugins: {
                            dynamic_toolbar: Y.Wegas.app.get('base') +
                                'wegas-editor/js/plugin/wegas-tinymce-dynamictoolbar.js'
                        },
                        branding: false,
                        /*
                         init_instance_callback : function(editor) {
                         console.log("Editor: " + editor.id + " is now initialized.");
                         },
                         */
                        //toolbar1: "bold italic bullist | link image media code addToolbarButton",
                        toolbar1: this.get('toolbar1'),
                        toolbar2: this.get('toolbar2'),
                        toolbar3: this.get('toolbar3'),
                        contextmenu: this.get('contextmenu'),
                        // formatselect removeformat underline unlink forecolor backcolor anchor previewfontselect fontsizeselect styleselect spellchecker template
                        menubar: false,
                        toolbar: this.get("showToolbar"),
                        statusbar: false,
                        relative_urls: false,
                        toolbar_items_size: 'small',
                        hidden_tootlbar: [2, 3],
                        setup: Y.bind(function(editor) {
                            if (this.get('disablePaste')) {
                                editor.on('paste', function(e) {
                                    e.preventDefault();
                                });
                            }
                            // Update on editor update
                            editor.on('change', Y.bind(this._onChange, this)); // click on taskbar buttons
                            editor.on('keyUp', Y.bind(this._onChange, this)); // text input & ctrl-related operations
                            //editor.on('NodeChange', Y.bind(this.setContent, this)); // Update on editor update
                            // Callback for when the editor has been initialized and setContent is allowed:
                            editor.on('init',
                                Y.bind(
                                    function() {
                                        this.editor = editor;
                                        // This will call setContent():
                                        this.syncUI();
                                    },
                                    this
                                    )
                                );
                        }, this),
                        image_advtab: true,
                        autoresize_min_height: 35,
                        autoresize_max_height: 500,
                        resize: this.getResize(),
                        content_css: [
                            Wegas.app.get('base') +
                                'wegas-editor/css/wegas-tinymce-editor.css'
                        ],
                        style_formats: [
                            {
                                // Style formats
                                title: 'Title 1',
                                block: 'h1'
                            },
                            {
                                title: 'Title 2',
                                block: 'h2'
                                    // styles : {
                                    //    color : '#ff0000'
                                    // }
                            },
                            {
                                title: 'Title 3',
                                block: 'h3'
                            },
                            {
                                title: 'Normal',
                                inline: 'span'
                            },
                            {
                                title: 'Code',
                                //icon: "code",
                                block: 'code'
                            }
                        ]
                    };

                    if (this.get("inlineEditorMode") === "inline") {
                        tinyCfg.inline = true;
                    } else if (this.get("inlineEditorMode") === "inlite") {
                        tinyCfg.inline = true;
                        tinyCfg.theme = "inlite";
                    }

                    tinyMCE.init(tinyCfg);
                }, this);
                //this.editor.render();
                //this.setContent();
                if (this.get('showSaveButton')) {
                    this.addButton = new Wegas.Button({
                        label: '<span class="wegas-icon wegas-icon-save"></span>',
                        tooltip: 'Save',
                        cssClass: 'wegas-text-input-save',
                        on: {
                            click: Y.bind(this.onSave, this)
                        }
                    }).render(this.get('contentBox').one('.wegas-text-input-toolbar'));
                }
            }
            // }, this);
        },
        getPayload: function(value) {
            var desc = this._descriptor || this.get('variable.evaluated');
            return {
                descriptor: desc,
                value: value
            };
        },
        bindUpdatedInstance: function() {
            if (this.onInstanceUpdate) {
                this.onInstanceUpdate.detach();
            }
            if (this.onInstanceLiveUpdate) {
                this.onInstanceLiveUpdate.detach();
            }
            var text = this.get('variable.evaluated');
            if (text) {
                var instance = text.getInstance();
                this.onInstanceUpdate = Y.Wegas.Facade.Instance.after(instance.get("id") + ':updatedInstance', this.syncUI, this);
                this.onInstanceLiveUpdate = Y.Wegas.Facade.Variable.after("TextInstance_" + instance.get("id") + ':LiveUpdate', this.liveLock, this);
            }
        },
        bindUI: function() {
            this.bindUpdatedInstance();
            this.after("variableChange", this.bindUpdatedInstance, this);
            this.on('save', this._save);
        },
        showLiveOverlay: function() {
            Y.Plugin.PopupListener.showOverlay(this.get("contentBox"));
        },
        hideLiveOverlay: function() {
            Y.Plugin.PopupListener.hideOverlay(this.get("contentBox"));
        },
        liveLock: function(entity) {
            this._setContent(I18n.t(entity.trValue));
            this.setStatus("someone is editing");
            if (this.waitLiveLock) {
                this.waitLiveLock.cancel();
            } else {
                this.showLiveOverlay();
            }
            this.waitLiveLock = Y.later(1250, this, function() {
                this.waitLiveLock = null;
                this.hideLiveOverlay();
                this.setStatus("");
            });
        },
        syncUI: function() {
            this.setContent();
        },
        setContent: function() {
            this._setContent(this.getInitialContent());
        },
        _setContent: function(content) {
            if (this.get('readonly.evaluated')) {
                this.get('contentBox')
                    .one('.wegas-text-input-editor')
                    .setContent(
                        '<div class="readonly wegas-template-content">' +
                        content +
                        '</div>'
                        );
            } else {
                if (this.editor) {
                    if (content != this._initialContent) {
                        this._initialContent = content;
                        this.editor.setContent(content);
                        this.updateCounters();
                    }
                } else {
                    // Nothing happens for now. Upon tinyMCE's event 'init', setContent will be called again.
                }
                /*var tmceI = tinyMCE.get(this.get("contentBox").one(".wegas-text-input-editor"));
                 if (tmceI) {
                 tmceI.setContent(this.getInitialContent());
                 }*/
            }
        },
        getInitialContent: function() {
            return this.get('variable.evaluated')
                .getInstance()
                .get('value');
        },
        setStatus: function(msg, item, klass) {
            item = item || 'status';
            klass = klass || '';
            if (this.get('showStatus')) {
                this.get('contentBox')
                    .one('.' + item)
                    .setContent('<p class="' + klass + '">' + msg + '</p>');
            }
        },
        fireEditing: function(content) {
            var payload = this.getPayload(content);
            var textInstance = payload.descriptor.getInstance().toObject();

            textInstance.trValue.translations = {};
            textInstance.trValue.translations[I18n.getCode()] = {
                status: "",
                translation: content,
            };

            this.fire('editing', payload);

            // live update: 
            //   1) send one liveUpdate ASAP
            //   2) send one liveUpdate each second until user stop editing
            this.queueLiveEdition(payload.descriptor.get("scopeType"),
                textInstance.scopeKey, textInstance);

        },
        processQueuedLiveEdition: function() {
            if (this.queuedLiveEdition) {
                // content has been updated since last update
                this.fireLiveEdition();
            } else {
                this.liveTimer = null;
            }
        },
        queueLiveEdition: function(scopeType, scopeKey, payload) {
            this.queuedLiveEdition = {
                scopeType: scopeType,
                scopeKey: scopeKey,
                textInstance: payload
            };

            if (!this.liveTimer) {
                // no timer -> send LiveUpdate ASAP
                this.fireLiveEdition();
                // then, send one Live update each 500ms
            }
        },
        fireLiveEdition: function() {

            var scopeType = this.queuedLiveEdition.scopeType;
            var scopeKey = this.queuedLiveEdition.scopeKey;
            var textInstance = this.queuedLiveEdition.textInstance;

            this.queuedLiveEdition = undefined;

            Y.Wegas.Facade.GameModel.sendRequest({
                request: "/LiveEdition/private-" + scopeType
                    .replace("Scope", "-" + scopeKey),
                cfg: {
                    method: 'POST',
                    data: textInstance
                }
            });

            this.liveTimer = Y.later(1000, this, this.processQueuedLiveEdition);
        },
        fireStopEditing: function(content) {
            this.fire('stopEditing', this.getPayload(content));
        },
        fireSaved: function(content) {
            this.fire('saved', this.getPayload(content));
        },
        fireSave: function(content) {
            this.fire('save', this.getPayload(content));
        },
        _onChange: function() {
            var content = this.editor.getContent();
            if (this.previousContent === undefined || this.previousContent !== content) {
                this.previousContent = content;
                if (this.get('showSaveButton') || !this.get('selfSaving')) {
                    this.setStatus('Not saved');
                } else {
                    this.setStatus('');
                }
                this.updateCounters();
                this.fireEditing(content);
                this.valueChanged(content);
                if (!this.get('showSaveButton')) {
                    if (this.wait) {
                        this.wait.cancel();
                    }
                    if (this.get('selfSaving')) {
                        this.wait = Y.later(1000, this, function() {
                            this.wait = null;
                            this.fireStopEditing(content);
                            this.onSave();
                        });
                    } else {
                        this.wait = Y.later(1000, this, function() {
                            this.wait = null;
                            this.fireStopEditing(content);
                        });
                        this.onSave();
                    }
                }
            } else {
                Y.log("No need to process same content twice...");
            }
        },
        valueChanged: function(newValue) {
            // To Be Overwritten
        },
        getResize: function() {
            var resize = this.get("resize");
            if (resize === "false") {
                return false;
            } else if (resize === "true") {
                return true;
            } else {
                return "both";
            }
        },
        getStats: function() {
            var body = this.editor.getContent(),
                countEmpty = this.get('countBlank'),
                stats = {};
            // Remove ML tags
            body = body.replace(/<[^>]*>/g, '');
            // Convert HTML entities to dummy characters
            body = body
                .replace(/&nbsp;/g, ' ')
                .replace(/&[a-zA-Z]*;/g, 'X');
            if (countEmpty) {
                stats.cc = body.length;
            } else {
                stats.cc = body.replace(/\s+/g, '').length;
            }
            body = body.replace(/\s+/g, ' ').trim(); // TRIMLIKE
            if (body === '') {
                stats.wc = 0;
            } else {
                stats.wc = body.split(' ').length;
            }
            return stats;
        },
        updateCounters: function() {
            var maxW, maxC, stats, valid = true;
            maxW = this.get('maxNumberOfWords');
            maxC = this.get('maxNumberOfCharacters');
            if (maxW || maxC) {
                stats = this.getStats();
                if (maxW) {
                    if (stats.wc > maxW) {
                        valid = false;
                    }
                    this.setStatus(
                        stats.wc + '/' + maxW,
                        'wc',
                        stats.wc > maxW ? 'invalid' : 'valid'
                        );
                }
                if (maxC) {
                    if (stats.cc > maxC) {
                        valid = false;
                    }
                    this.setStatus(
                        stats.cc + '/' + maxC,
                        'cc',
                        stats.cc > maxC ? 'invalid' : 'valid'
                        );
                }
            }
            return valid;
        },
        onSave: function() {
            if (!this.editor)
                return; // Is null when save timeout occurs too late (e.g. after leaving the current page).
            var value = this.editor.getContent(), valid, msg;
            valid = true || this.updateCounters(); // Fixme do something... (prevent saving or not...)
            if (valid) {
                msg = this.save(value)
                    ? 'saving...'
                    : 'Something went wrong';
                if (!this.get('selfSaving')) {
                    msg = '';
                }
            } else {
                msg = 'Size limit exceeded';
            }
            this.setStatus(msg);
        },
        _save: function(e) {
            var value = e.value, theVar = e.descriptor.getInstance();
            if (this.get('selfSaving')) {
                if (!this.waitForValue) {
                    this.processSave(value, e.descriptor);
                } else {
                    this.queuedValue = {
                        value: value,
                        descriptor: e.descriptor
                    };
                }
            } else {
                this._initialContent = value;
                theVar.set('value', value);
                this.setStatus('saved');
                this._saved(value);
            }
        },
        processSave: function(value, descriptor) {
            var theVar = descriptor.getInstance(),
                cb = this.get('contentBox');
            this.waitForValue = value;
            this._initialContent = value;
            theVar.set('value', value);
            Wegas.Facade.Variable.script.remoteEval(
                'Variable.find(gameModel, "' + descriptor.get('name') + '")'
                + '.setValue(self, ' + JSON.stringify(value) + ');',
                {
                    on: {
                        success: Y.bind(function() {
                            cb.removeClass('loading');
                            this.setStatus('saved');
                            this._saved(value);
                        }, this),
                        failure: Y.bind(function() {
                            cb.removeClass('loading');
                            this.setStatus('Something went wrong');
                            this._saved(value);
                        }, this)
                    }
                }
            );
        },
        _saved: function(value) {
            this.fireSaved(value);
            if (this.waitForValue === value) {
                this.waitForValue = null;
                if (this.queuedValue) {
                    if (this.queuedValue.value !== value) {
                        this.processSave(this.queuedValue.value, this.queuedValue.descriptor);
                    }
                    this.queuedValue = null;
                }
            }
        },
        save: function(value) {
            var cb = this.get('contentBox');
            if (this.get('selfSaving')) {
                cb.addClass('loading');
            }
            this.fireSave(value);
            return true;
        },
        getEditorLabel: function() {
            return 'TextInput';
        },
        destructor: function() {
            if (this.wait) {
                this.wait.cancel();
                this.onSave();
            }
            try {
                this.editor && this.editor.remove();
            } catch (e) {
                console.debug(e);
            }
            this.editor = null;
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
            if (this.onInstanceUpdate) {
                this.onInstanceUpdate.detach();
            }
            if (this.onInstanceLiveUpdate) {
                this.onInstanceLiveUpdate.detach();
            }
            if (this.addButton) {
                this.addButton.destroy();
            }
        }
    }, {
        /** @lends Y.Wegas.TextInput */
        EDITORNAME: 'TextInput',
        ATTRS: {
            /**
             * The target variable, returned either based on the name attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                required: true,
                view: {
                    type: 'variableselect',
                    label: 'variable',
                    classFilter: ['TextDescriptor']
                }
            },
            readonly: {
                type: ["null", "object"],
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                index: 100,
                value: {
                    "@class": "Script",
                    "content": "false;"
                },
                properties: {
                    "@class": {type: "string", value: "Script"},
                    content: {
                        type: "string"
                    }
                },
                view: {
                    type: 'scriptcondition',
                    label: 'Readonly'
                }
            },
            showToolbar: {
                type: 'boolean',
                value: true,
                view: {label: 'Show toolbar'}
            },
            showSaveButton: {
                type: 'boolean',
                value: true,
                view: {label: 'Show save button'}
            },
            selfSaving: {
                type: 'boolean',
                value: true,
                view: {label: 'Auto save'}
            },
            showStatus: {
                type: 'boolean',
                value: true,
                view: {label: 'Show status'}
            },
            label: {
                type: 'string',
                optional: true,
                view: {label: 'Label'}
            },
            maxNumberOfCharacters: {
                type: 'number',
                optional: true,
                value: undefined,
                view: {label: 'Maximum length'}
            },
            maxNumberOfWords: {
                type: 'number',
                optional: true,
                value: undefined,
                view: {label: 'Maximum word count'}
            },
            countBlank: {
                type: 'boolean',
                value: false,
                view: {label: 'Count blank'}
            },
            disablePaste: {
                type: 'boolean',
                value: false,
                view: {label: 'Disable paste'}
            },
            inlineEditorMode: {
                type: 'string',
                value: "default",
                view: {
                    type: "select",
                    className: "wegas-advanced-feature",
                    label: 'inline editor mode',
                    choices: [
                        "default", "inline", "inlite"
                    ]
                }
            },
            toolbar1: {
                type: 'string',
                value: 'bold italic bullist | link code addToolbarButton',
                index: 6,
                view: {label: 'Toolbar 1'}
            },
            toolbar2: {
                type: 'string',
                value: 'forecolor backcolor underline alignleft aligncenter alignright alignjustify table',
                index: 7,
                view: {label: 'Toolbar 2'}
            },
            toolbar3: {
                type: 'string',
                value: 'fontselect fontsizeselect styleselect',
                index: 8,
                view: {label: 'Toolbar 3'}
            },
            contextmenu: {
                type: 'string',
                value: 'link image inserttable | cell row column deletetable | formatselect forecolor',
                index: 9,
                view: {label: 'Context menu'}
            },
            resize: {
                type: "string",
                value: "both",
                view: {
                    label: 'resize',
                    type: "select",
                    choices: [
                        {
                            value: 'both',
                            label: 'both'
                        },
                        {
                            value: 'true',
                            label: 'Vertical'
                        },
                        {
                            value: 'false',
                            label: 'no'
                        }
                    ]
                }
            }
        }
    });
    Y.Wegas.TextInput = TextInput;


    StringInput = Y.Base.create('wegas-string-input', Y.Widget,
        [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: '<div>' +
            '<div class="wegas-input-label"></div>' +
            '<div class="wegas-input-body">' +
            '  <div class="wegas-input-text"></div>' +
            '</div>' +
            '</div>',
        initializer: function() {
            this.handlers = [];
            this._initialValue = undefined;
            this.publish('save', {
                emitFacade: true
            });
            this.publish('editing', {
                emitFacade: true
            });
            /* to be fired if content is edited and canceled in a shot */
            this.publish('revert', {
                emitFacade: true
            });
            this.publish('saved', {
                emitFacade: true
            });
            this.publish('stopEditing', {
                emitFacade: true
            });
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });

            this.destroySortHandle();
            if (this.onInstanceUpdate) {
                this.onInstanceUpdate.detach();
            }

        },
        getPayload: function(value) {
            var desc = this._descriptor || this.get('variable.evaluated');
            return {
                descriptor: desc,
                value: value
            };
        },
        getNumSelectable: function() {
            var numSelectable = this.get('numSelectable');
            if (Y.Lang.isNumber(numSelectable)) {
                return numSelectable;
            } else {
                var desc = this.get('variable.evaluated');
                return desc.get("maxSelectable") || Number.POSITIVE_INFINITY;
            }
        },
        getSortable: function() {
            var desc = this.get('variable.evaluated');
            return desc && desc.get("sortable") || false;
        },
        /**
         * Try to save value.
         * @param {type} value the new value to save
         * @param {addMode} set to true if you want to add ar make sure values is selected, undefined of false will toggle selection state
         * @returns {Boolean} true is the value has been saved, false otherwise
         */
        updateValue: function(value) {
            var desc = this.get('variable.evaluated'),
                inst = desc.getInstance(),
                values,
                iValue,
                numSelectable,
                cb = this.get('contentBox'),
                allowedValues = desc.get('allowedValues');
            if (allowedValues && allowedValues.length > 0) {
                if (!(this.get('allowNull') && value === '') &&
                    !Y.Array.find(allowedValues, function(item) {
                        return item.get("name") === value;
                    }, this)) {
                    this.showMessage('error', Y.Wegas.I18n.t('errors.prohibited', {
                        value: desc.getLabelForAllowedValue(value),
                        values: Y.Array.map(allowedValues, function(item) {
                            return I18n.t(item.get("label"));
                        })
                    }));
                    return false;
                }
                numSelectable = this.getNumSelectable();
                if (numSelectable > 1) {
                    iValue = inst.get('value');
                    if (!iValue) {
                        values = [];
                    } else {
                        if (iValue.indexOf("[") !== 0) {
                            values = [iValue];
                        } else {
                            values = JSON.parse(iValue);
                        }
                    }
                    if (values.indexOf(value) >= 0) {
                        values.splice(values.indexOf(value), 1);
                    } else {
                        if (values.length >= numSelectable) {
                            this.showMessage('error', Y.Wegas.I18n.t('errors.limitReached', {
                                num: numSelectable
                            }));
                            return false;
                        } else {
                            values.push(value);
                        }
                    }
                    value = JSON.stringify(values);
                } else {
                    // Only one value -> replace
                    value = JSON.stringify([value]);
                }
            }
            this.updateEffectiveValue(value);
        },
        updateEffectiveValue: function(value) {
            var desc = this.get('variable.evaluated'),
                inst = desc.getInstance();
            if (inst.get('value') !== value) {
                // HERE
                this._initialValue = value;
                if (this.get('selfSaving')) {
                    this.get("contentBox").addClass('loading');
                }
                this.fire('save', this.getPayload(value));
            } else {
                this.fire('revert', this.getPayload(value));
            }
            return true;
        },
        onDragEnd: function(e) {
            if (!this.get('readonly.evaluated')) {
                var selectedsContainer = this.get("contentBox").one(".selecteds");
                var values = [];
                selectedsContainer.all("li").each(function(item) {
                    values.push(item.getData().value)
                }, this);


                var numSelectable = this.getNumSelectable();

                if (values.length > numSelectable) {
                    this.showMessage('error', Y.Wegas.I18n.t('errors.limitReached', {
                        num: numSelectable
                    }));
                    this.syncUI();
                } else {
                    this.updateEffectiveValue(JSON.stringify(values));
                }
            }
        },
        _save: function(e) {
            var inst = e.descriptor.getInstance(),
                cb = this.get('contentBox'),
                value = e.value;
            this._initialContent = value;
            inst.set('value', value);
            if (this.get('selfSaving')) {
                Wegas.Facade.Variable.script.remoteEval('Variable.find(gameModel, "' + e.descriptor.get('name') + '")'
                    + '.setValue(self, ' + JSON.stringify(value) + ');', {
                    on: {
                        success: Y.bind(function() {
                            cb.removeClass('loading');
                            this._saved(value);
                        }, this),
                        failure: Y.bind(function() {
                            cb.removeClass('loading');
                            this._saved(value);
                        }, this)
                    }
                });
            } else {
                this._saved(value);
                this.syncUI();
            }
        },
        _saved: function(value) {
            var desc = this.get('variable.evaluated');
            this.fire('saved', this.getPayload(value));
        },
        renderUI: function() {
            var desc = this.get('variable.evaluated'),
                inst = desc.getInstance(),
                allowedValues = desc.get('allowedValues'),
                CB = this.get('contentBox'),
                input = CB.one('.wegas-input-text'),
                label = CB.one('.wegas-input-label'),
                i,
                value,
                content;
            this._descriptor = desc;
            if (this.get('label')) {
                label.setContent(this.get('label'));
            }

            if (allowedValues && allowedValues.length > 0) {
                if (!this.get('clickSelect')) {
                    // SELECT
                    content = ['<select>'];
                    content.push('<option value="" ' + (this.get("allowNull") ? 'disabled' : '') + 'selected>' +
                        '--select--</option>');
                    for (i in allowedValues) {
                        value = allowedValues[i];
                        content.push('<option value=' + JSON.stringify(value.get("name")) + ' ' +
                            (value.get("name") === inst.get('value') ? "selected=''" : '') + '>' +
                            I18n.t(value.get("label")) + '</option>');
                    }
                    content.push('</select>');
                    input.setContent(content.join(''));
                } else {
                    if (this.getSortable()) {
                        // Ordonnable CheckboxesLike
                        content = [
                            '<ol class="wegas-string-input-checkboxes selecteds"></ol>',
                            '<ul class="wegas-string-input-checkboxes unselecteds">'
                        ];
                        for (i in allowedValues) {
                            value = allowedValues[i];
                            content.push('<li role="button" tabindex="0" data-value='
                                + JSON.stringify(value.get("name")) + '>'
                                + I18n.t(value.get("label")) + '</li>');
                        }

                        if (this.get('allowNull')) {
                            content.push('<li data-value="">' + I18n.t('global.dunno') + '</li>');
                        }
                        content.push('</ul>');
                        input.setContent(content.join(''));
                    } else {
                        // CheckBox Like
                        content = [
                            '<ul class="wegas-string-input-checkboxes">'
                        ];
                        for (i in allowedValues) {
                            value = allowedValues[i];
                            content.push('<li role="button" tabindex="0" data-value='
                                + JSON.stringify(value.get("name")) + ' '
                                + (value.get("name") === inst.get('value') ? "class='selected'" : '') + '>'
                                + I18n.t(value.get("label")) + '</li>');
                        }

                        if (this.get('allowNull')) {
                            content.push('<li data-value="">' + I18n.t('global.dunno') + '</li>');
                        }
                        content.push('</ul>');
                        input.setContent(content.join(''));
                    }
                }
            } else {
                // INPUT
                value = value || '';
                input.setContent('<input value="' + value + '" />');
            }
        },
        syncUI: function() {
            var desc = this.get('variable.evaluated'),
                allowedValues = desc.get('allowedValues'),
                inst = desc.getInstance(),
                CB = this.get('contentBox'),
                value = inst.get('value'),
                values,
                i,
                readonly = this.get('readonly.evaluated') || false, // toggleClass required a well-defined boolean!
                input,
                select,
                option,
                i;
            this.get('boundingBox').toggleClass('readonly', readonly);
            if (allowedValues && allowedValues.length > 0) {
                if (!this.get('clickSelect')) {
                    select = CB.one('select');
                    select.set('disabled', readonly);

                    if (value.indexOf("[") === 0) {
                        value = JSON.parse(value)[0];
                    }

                    if (this._initialValue !== value) {
                        this._initialValue = value;
                        select.all("option").removeAttribute('selected');
                        option = select.one("option[value='" + value + "']");
                        option && option.setAttribute('selected');
                    }

                    if (readonly && this.get('displayChoicesWhenReadonly')) {
                        //CB.one("select").addClass("hidden");
                        input = CB.one('.wegas-input-text');
                        input.all('ul').each(function(ul) {
                            ul.remove();
                        });
                        select = ['<ul>'];
                        for (i in allowedValues) {
                            option = allowedValues[i];
                            select.push('<li class="', (value === option.get("name") ? 'selected' : 'unselected') + '">',
                                I18n.t(option.get("label")), '</li>');
                        }
                        select.push('</ul>');
                        input.append(select.join(''));
                    }
                } else {
                    //if (this.get("numSelectable") > 1) {
                    if (!value) {
                        value = '[]';
                    }
                    // value shall always be an array (even an empty one!)
                    if (value.indexOf("[") !== 0) {
                        values = [value];
                    } else {
                        values = JSON.parse(value);
                    }
                    var numSelectable = this.getNumSelectable();
                    var maxReached = values.length >= numSelectable;
                    var sortable = this.getSortable();

                    if (sortable) {
                        var selectedsContainer = CB.one(".selecteds");
                        var unselectedsContainer = CB.one(".unselecteds");

                        // First deselect previously selected and move them to the unselected list
                        var selecteds = selectedsContainer.all('li');

                        selecteds.each(function(selected) {
                            selectedsContainer.removeChild(selected);
                            unselectedsContainer.appendChild(selected);
                        }, this);

                        // make sure none is selected
                        unselectedsContainer.all("li").removeClass("selected");

                        // then process effective selected values
                        for (i in values) {
                            var selected = CB.one('li[data-value="' + values[i] + '"]');
                            selected.addClass('selected');

                            selected.remove();
                            selectedsContainer.appendChild(selected);
                        }
                        if (readonly) {
                            this.destroySortHandle();
                        }
                    } else {
                        select = CB.one('.wegas-string-input-checkboxes');
                        select.all('.selected').removeClass('selected');
                        select.toggleClass("maximumReached", maxReached && numSelectable !== 1);

                        for (i in values) {
                            select.all('li[data-value="' + values[i] + '"]').addClass('selected');
                        }
                    }
                }
            } else {
                input = CB.one('input');
                input.set('disabled', readonly);
                if (this._initialValue !== value) {
                    this._initialValue = value;
                    input.set('value', value);
                }
            }
        },
        destroySortHandle: function() {
            this.sortHandle1 && this.sortHandle1.destroy();
            this.sortHandle2 && this.sortHandle2.destroy();
        },
        bindUpdatedInstance: function() {
            if (this.onInstanceUpdate) {
                this.onInstanceUpdate.detach();
            }
            var question = this.get('variable.evaluated');
            if (question) {
                this.onInstanceUpdate = Y.Wegas.Facade.Instance.after(question.getInstance()
                    .get("id") + ':updatedInstance', this.syncUI, this);
            }
        },
        bindUI: function() {
            var CB = this.get("contentBox");
            this.bindUpdatedInstance();

            this.after("variableChange", this.bindUpdatedInstance, this);

            var input, select, ul;
//            this.handlers.push(
//                Y.Wegas.Facade.Variable.after('update', this.syncUI, this)
//                );
            input = CB.one('input');
            if (input) {
                //this.handlers.push(input.on("blur", this.updateFromInput, this));
                this.handlers.push(input.on('valuechange', this.keyUp, this));
            }
            select = CB.one('select');
            if (select) {
                this.handlers.push(
                    select.on('change', this.updateFromSelect, this)
                    );
            }
            ul = CB.one('ul');
            if (ul) {
                this.handlers.push(CB.delegate('key', this.updateFromUl, 'up:13,32', 'li', this));
                this.handlers.push(CB.delegate('click', this.updateFromUl, 'li', this));
            }
            this.on('save', this._save);

            var sortable = this.getSortable() && !this.get('readonly.evaluated');

            if (sortable && this.get('clickSelect')) {
                var selectedsContainer = CB.one(".selecteds");
                var unselectedsContainer = CB.one(".unselecteds");
                var constrain = CB.one(".wegas-input-text");

                this.destroySortHandle();

                this.sortHandle1 = new Y.Sortable({
                    container: selectedsContainer,
                    nodes: "li",
                    opacity: ".5"
                });
                this.sortHandle1.delegate.after("drag:end", this.onDragEnd, this);


                this.sortHandle2 = new Y.Sortable({
                    container: unselectedsContainer,
                    nodes: "li",
                    opacity: ".5"
                });
                this.sortHandle2.delegate.after("drag:end", this.onDragEnd, this);

                this.sortHandle1.delegate.dd.plug((Y.Plugin.DDConstrained, {
                    constrain2node: constrain
                }));

                this.sortHandle2.delegate.dd.plug((Y.Plugin.DDConstrained, {
                    constrain2node: constrain
                }));

                this.sortHandle1.join(this.sortHandle2);
            }
        },
        updateFromUl: function(e) {
            var v;
            if (!this.get('readonly.evaluated')) {
                v = JSON.parse('"' + e.target.getData().value + '"');
                this.updateValue(v);
            }
        },
        updateFromSelect: function(e) {
            if (!this.get('readonly.evaluated')) {
                this.updateValue(e.target.get('value'));
            }
        },
        keyUp: function(e) {
            var input = this.get(CONTENTBOX).one('input'),
                value = input.get('value');
            this.fire('editing', this.getPayload(value));
            this.updateFromInput();
        },
        updateFromInput: function(e) {
            var input = this.get(CONTENTBOX).one('input'),
                data = input.getData(),
                value = input.get('value');
            if (this.wait) {
                this.wait.cancel();
            }
            if (this.get('selfSaving')) {
                this.wait = Y.later(1000, this, function() {
                    this.wait = null;
                    this.fire('stopEditing', this.getPayload(value));
                    this.updateValue(value);
                });
            } else {
                this.wait = Y.later(1000, this, function() {
                    this.wait = null;
                    this.fire('stopEditing', this.getPayload(value));
                });
                this.updateValue(value);
            }
        }
    }, {
        /** @lends Y.Wegas.StringInput */
        EDITORNAME: 'StringInput',
        ATTRS: {
            /**
             * The target variable, returned either based on the name attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                required: true,
                index: 1,
                view: {
                    type: 'variableselect',
                    label: 'Variable',
                    classFilter: ['StringDescriptor']
                }
            },
            displayChoicesWhenReadonly: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: 'boolean',
                value: false,
                required: true,
                index: 52,
                visible: function(val, formVal) {
                    if (formVal.variable) {
                        var variable = Y.Wegas.Facade.Variable.script.localEval(formVal.variable);
                        return variable && variable.get("allowedValues").length > 0;
                    }
                    return false;
                },
                view: {
                    type: 'scriptcondition',
                    label: 'Display choices when readonly'
                }
            },
            selfSaving: {
                type: 'boolean',
                index: 100,
                value: true,
                view: {label: 'Auto save'}
            },
            clickSelect: {
                type: 'boolean',
                value: false,
                index: 31,
                visible: function(val, formVal) {
                    if (formVal.variable) {
                        var variable = Y.Wegas.Facade.Variable.script.localEval(formVal.variable);
                        return variable && variable.get("allowedValues").length > 0;
                    }
                    return false;
                },
                view: {label: 'Click select'}
            },
            allowNull: {
                type: 'boolean',
                index: 100,
                value: true,
                view: {label: 'Allow null'}
            },
            numSelectable: {
                type: 'number',
                index: 32,
                visible: function(val, formVal) {
                    return formVal.clickSelect;
                },
                view: {label: 'Number of selectable'}
            },
            readonly: {
                type: ["null", "object"],
                index: 100,
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                value: {
                    "@class": "Script",
                    "content": "false;"
                },
                properties: {
                    "@class": {type: "string", value: "Script"},
                    content: {
                        type: "string"
                    }
                },
                view: {
                    type: 'scriptcondition',
                    label: 'Readonly'
                }
            },
            label: {
                type: 'string',
                index: 0,
                view: {label: 'Label'}
            }
        }
    });
    Wegas.StringInput = StringInput;


    var BooleanInput = Y.Base.create('wegas-boolean-input', Y.Widget,
        [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: '<div>' +
            '<div class="wegas-input-label"></div>' +
            '<div class="wegas-input-body">' +
            '  <span class="wegas-input-boolean"></span>' +
            '</div>' +
            '</div>',
        initializer: function() {
            this.handlers = [];
            this._initialValue = undefined;
            this.publish('save', {
                emitFacade: true
            });
            this.publish('editing', {
                emitFacade: true
            });
            /* to be fired if content is edited and canceled in a shot */
            this.publish('revert', {
                emitFacade: true
            });
            this.publish('saved', {
                emitFacade: true
            });
            this.publish('stopEditing', {
                emitFacade: true
            });
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });

            if (this.onInstanceUpdate) {
                this.onInstanceUpdate.detach();
            }

        },
        getPayload: function(value) {
            var desc = this._descriptor || this.get('variable.evaluated');
            return {
                descriptor: desc,
                value: value
            };
        },
        /**
         * Try to save value.
         * @param {type} value the new value to save
         * @returns {Boolean} true is the value has been saved, false otherwise
         */
        updateValue: function(value) {
            var desc = this.get('variable.evaluated'),
                inst = desc.getInstance(),
                cb = this.get('contentBox');

            if (inst.get('value') !== value) {
                this._initialValue = value;
                if (this.get('selfSaving')) {
                    cb.addClass('loading');
                }
                this.fire('save', this.getPayload(value));
            } else {
                this.fire('revert', this.getPayload(value));
            }
            return true;
        },
        _save: function(e) {
            var inst = e.descriptor.getInstance(),
                cb = this.get('contentBox'),
                value = e.value;
            this._initialContent = value;
            inst.set('value', value);
            if (this.get('selfSaving')) {
                Wegas.Facade.Variable.script.remoteEval(
                    'Variable.find(gameModel, "' + e.descriptor.get('name') + '")'
                    + '.setValue(self, ' + (value ? "true" : "false") + ');',
                    {
                        on: {
                            success: Y.bind(function() {
                                cb.removeClass('loading');
                                this._saved(value);
                            }, this),
                            failure: Y.bind(function() {
                                cb.removeClass('loading');
                                this._saved(value);
                            }, this)
                        }
                    }
                );
            } else {
                this._saved(value);
                this.syncUI();
            }
        },
        _saved: function(value) {
            this.fire('saved', this.getPayload(value));
        },
        renderUI: function() {
            var desc = this.get('variable.evaluated'),
                CB = this.get('contentBox'),
                label = CB.one('.wegas-input-label'),
                input = CB.one('.wegas-input-boolean'),
                content;
            this._descriptor = desc;
            if (this.get('label')) {
                label.setContent(this.get('label'));
            }

            // CheckBox Like
            content = [
                '<ul class="wegas-boolean-input-checkboxes">'
            ];

            content.push('<li role="button" tabindex="0" data-value="true">' + I18n.t("global.yes") + '</li>');
            content.push('<li role="button" tabindex="0" data-value="false">' + I18n.t("global.no") + '</li>');

            content.push('</ul>');
            input.setContent(content.join(''));
        },
        syncUI: function() {
            var desc = this.get('variable.evaluated'),
                inst = desc.getInstance(),
                CB = this.get('contentBox'),
                value = inst.get('value'),
                readonly = this.get('readonly.evaluated') || false, // toggleClass required a well-defined boolean!
                ul;
            this.get('boundingBox').toggleClass('readonly', readonly);

            // First deselect all
            ul = CB.one('.wegas-boolean-input-checkboxes');
            ul.all('.selected').removeClass('selected');

            //then select
            ul.one("[data-value='" + (value ? "true" : "false") + "']").addClass("selected");
        },

        bindUpdatedInstance: function() {
            if (this.onInstanceUpdate) {
                this.onInstanceUpdate.detach();
            }
            var question = this.get('variable.evaluated');
            if (question) {
                this.onInstanceUpdate = Y.Wegas.Facade.Instance.after(question.getInstance()
                    .get("id") + ':updatedInstance', this.syncUI, this);
            }
        },
        bindUI: function() {
            this.bindUpdatedInstance();
            this.after("variableChange", this.bindUpdatedInstance, this);

            this.handlers.push(this.get(CONTENTBOX).delegate('key', this.updateFromUl, 'up:13,32', 'li', this));
            this.handlers.push(this.get(CONTENTBOX).delegate('click', this.updateFromUl, 'li', this));
            this.on('save', this._save);
        },
        updateFromUl: function(e) {
            if (!this.get('readonly.evaluated')) {
                // toggle
                var clickedValue = e.target.getData().value === "true";
                var isSelected = e.target.hasClass("selected");
                var newValue = clickedValue ? !isSelected : isSelected; // XOR
                this.updateValue(newValue);
            }
        }
    }, {
        /** @lends Y.Wegas.BooleanInput */
        EDITORNAME: 'BooleanInput',
        ATTRS: {
            /**
             * The target variable, returned either based on the name attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                required: true,
                index: 1,
                view: {
                    type: 'variableselect',
                    label: 'Variable',
                    classFilter: ['BooleanDescriptor']
                }
            },
            selfSaving: {
                type: 'boolean',
                index: 100,
                value: true,
                view: {label: 'Auto save'}
            },
            readonly: {
                type: ["null", "object"],
                index: 100,
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                value: {
                    "@class": "Script",
                    "content": "false;"
                },
                properties: {
                    "@class": {type: "string", value: "Script"},
                    content: {
                        type: "string"
                    }
                },
                view: {
                    type: 'scriptcondition',
                    label: 'Readonly'
                }
            },
            label: {
                type: 'string',
                index: 0,
                view: {label: 'Label'}
            }
        }
    });
    Wegas.BooleanInput = BooleanInput;

});
