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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-plugin', function(Y) {
    'use strict';
    var HOST = 'host',
        Plugin = Y.Plugin,
        Wegas = Y.namespace('Wegas'),
        PREVIEW_PAGELOADER_ID = 'previewPageLoader',
        PAGELOADER_CONFIG = {
            FULL_PAGE: {
                label: 'Entire page',
                value: 'Entire page'
            },
            CURRENT_PAGE_LOADER: {
                label: 'Current page display',
                value: 'Current page display'
            }
        };

    /**
     *  @name Y.Wegas.Plugin
     *  @class Extension that adds editable capacities to plugins
     *  @extends Y.Plugin
     *  @constructor
     */
    Wegas.Plugin = function() {};
    Y.mix(Wegas.Plugin.prototype, {
        showMessage: function() {
            return this.get(HOST).showMessage.apply(this.get(HOST), arguments);
        },
        showOverlay: function() {
            return this.get(HOST).showOverlay();
        },
        hideOverlay: function() {
            return this.get(HOST).hideOverlay();
        }
    });
    Y.mix(Wegas.Plugin, {
        ATTRS: {
            host: {
                transient: true
            },
            initialized: {
                transient: true
            },
            destroyed: {
                transient: true
            }
        },
        /**
         * @function
         * @private
         * @static
         * @param {String} name
         * @return Status node
         * @description Get Class From plugin name. Hopefully a unique name ...
         */
        getPluginFromName: function(name) {
            for (var i in Plugin) {
                if (Plugin[i].NAME === name) {
                    return '' + i;
                }
            }
            if (Plugin[name]) {
                return name;  // @HACK some places send the classname instead of the plugin name (e.g. conditional disable)
            }
            return undefined;
        }
    });
    /**
     *  @name Y.Plugin.Action
     *  @extends Y.Plugin.Base
     *  @augments Y.Wegas.Plugin
     *  @augments Y.Wegas.Editable
     *  @class
     *  @constructor
     */
    var Action = Y.Base.create('wegas-actionplugin', Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Action */
        /**
         * @function
         * @private
         */
        initializer: function() {
            this.handlers = [];
            this.get(HOST)
                .get('boundingBox')
                .addClass('wegas-' + this.get('targetEvent'));
            this.onHostEvent(this.get('targetEvent'), this.filterEvent);
        },
        filterEvent: function(e) {
            // Yui delegate design fire the event for each nested wiedget:we do not want this behaviour
            // Hence, we make sure event target is the host
            if (this.get("host") === e.target) {
                this.execute();
            }
        },
        /**
         * @function
         * @protected
         */
        execute: function() {
            Y.error(
                'Y.Plugin.Action.execute() is abstract, should be overridden'
                );
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         */
        destructor: function() {
            for (var i = 0; i < this.handlers.length; i += 1) {
                if (this.handlers[i].detach) {
                    // EventHandle
                    this.handlers[i].detach();
                } else if (this.handlers[i].cancel) {
                    //Timer
                    this.handlers[i].cancel();
                }
            }
        }
    }, {
        NS: 'wegas',
        ATTRS: {
            targetEvent: {
                type: 'string',
                value: 'click',
                view: {
                    type: 'hidden'
                }
            }
        }
    });
    Plugin.Action = Action;

    /**
     *  @class
     *  @name Y.Plugin.FireAndForgetRequestAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var FireAndForgetRequestAction = Y.Base.create('FireAndForgetRequest',
        Action, [], {
        execute: function() {
            var headers = Y.mix({}, this.get("headers"));
            Y.mix(headers, {
                "Content-Type": "application/json"
            });

            var url = this.get("url");
            Y.io(Wegas.app.get('base') + url.startsWith("/") ? url.substring(1) : url, {
                method: this.get('method'),
                data: this.get('data'),
                headers: headers
            });
        }
    }, {
        NS: 'fireandforgetrequestaction',
        ATTRS: {
            url: {
                type: 'string',
                view: {
                    label: 'Url'
                }
            },
            method: {
                type: 'string',
                value: 'GET',
                view: {
                    choices: [{
                            value: 'GET'
                        }, {
                            value: 'POST'
                        }, {
                            value: 'DELETE'
                        }, {
                            value: 'PUT'
                        }
                    ]}
            },
            data: {
                type: 'string',
                view: {
                    label: 'Data'
                }
            },
            headers: {
                type: "object",
                value: {}
            }
        }
    });
    Plugin.FireAndForgetRequestAction = FireAndForgetRequestAction;
    /**
     *  @class
     *  @name Y.Plugin.OpenUrlAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var OpenUrlAction = Y.Base.create('OpenUrlAction', Action, [], {
        execute: function() {
            this.open(this.get('url'));
        },
        open: function(url) {
            if (
                url.indexOf('http://') !== 0 &&
                url.indexOf('https://') !== 0 &&
                url.indexOf('//') !== 0
            ) {
                url = Wegas.app.get('base') + url.startsWith("/") ? url.substring(1) : url;
            }
            if (this.get('target') === 'blank') {
                window.open(url);
            } else {
                window.location.href = url;
            }
        }
    }, {
        NS: 'openurlaction',
        ATTRS: {
            url: {
                type: 'string',
                view: {
                    label: 'Open url'
                }
            },
            /**
             * Can be "self" or "blank"
             */
            target: {
                type: 'string',
                value: 'blank',
                view: {
                    type: 'select',
                    choices: [
                        {
                            value: 'blank',
                            label: 'In a new page'
                        },
                        {
                            value: 'self',
                            label: 'In the same page'
                        }
                    ]
                }
            }
        }
    });
    Plugin.OpenUrlAction = OpenUrlAction;

    /**
     *  @class
     *  @name Y.Plugin.OpenUrlAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var OpenFileAction = Y.Base.create('OpenFilAction', Action, [], {
        execute: function() {
            var theFile = Y.Wegas.Facade.File.get("source") + "read" + I18n.t(this.get("file"));

            this.open(theFile);
        },
        open: function(url) {
            if (
                url.indexOf('http://') !== 0 &&
                url.indexOf('https://') !== 0 &&
                url.indexOf('//') !== 0
                ) {
                url = Wegas.app.get('base') + url.startsWith("/") ? url.substring(1) : url;
            }
            if (this.get('target') === 'blank') {
                window.open(url);
            } else {
                window.location.href = url;
            }
        }
    }, {
        NS: 'openfileaction',
        ATTRS: {
            file: Y.Wegas.Helper.getTranslationAttr({
                type: "wegasurl", label: "File"
            }),
            /**
             * Can be "self" or "blank"
             */
            target: {
                type: 'string',
                value: 'blank',
                view: {
                    type: 'select',
                    choices: [
                        {
                            value: 'blank',
                            label: 'In a new page'
                        },
                        {
                            value: 'self',
                            label: 'In the same page'
                        }
                    ]
                }
            }
        }
    });
    Plugin.OpenFileAction = OpenFileAction;



    /**
     *  @class
     *  @name Y.Plugin.PrintActionPlugin
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var PrintActionPlugin = Y.Base.create('PrintActionPlugin', Action, [], {
        execute: function() {
            var outputType = this.get('outputType'),
                displayPath = this.get('displayPath'),
                title = this.get('title.evaluated'),
                playerId = Wegas.Facade.Game.get('currentPlayerId'),
                roots = this.get('root.evaluated'),
                root = '',
                printUrl;

            if (roots) {
                if (!Y.Lang.isArray(roots)) {
                    roots = [roots];
                }
                Y.Array.each(
                    roots,
                    function(d) {
                        root += d.get('name') + ',';
                    },
                    this
                    );
                root = root.slice(0, -1);
            }

            printUrl =
                Wegas.app.get('base') +
                'print.html?id=' +
                playerId +
                '&outputType=' +
                outputType +
                '&displayPath=' +
                displayPath +
                (title ? '&title=' + title : '') +
                '&root=' +
                encodeURIComponent(root);
            window.open(printUrl);
        }
    }, {
        NS: 'PrintActionPlugin',
        ATTRS: {
            root: {
                type: 'object',
                /**
                 * The target variable, returned either based on the name attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Root Variable'
                }
            },
            title: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Title'
                }
            },
            /**
             * Can be "html" or "pdf"
             */
            outputType: {
                type: 'string',
                value: 'html',
                view: {
                    type: 'select',
                    choices: ['html', 'pdf'],
                    label: 'output type'
                }
            },
            displayPath: {
                type: 'string',
                value: 'true',
                view: {
                    type: 'select',
                    choices: ['true', 'false'],
                    label: 'Display Path'
                }
            }
        }
    });
    Plugin.PrintActionPlugin = PrintActionPlugin;

    /**
     *  @class
     *  @name Y.Plugin.OpenPageAction
     *  @extends Y.Plugin.Action
     *  @module Wegas
     *  @constructor
     */
    var OpenPageAction = Y.Base.create('OpenPageAction', Action, [], {
        initializer: function() {
            this.afterHostEvent('render', function() {
                var targetPageLoader = this._getTargetPageLoader();
                if (targetPageLoader) {
                    this.selectHost(targetPageLoader);
                    this.handlers.push(targetPageLoader.after('pageIdChange', function() {
                        try {
                            this.selectHost(targetPageLoader);
                        } catch (e) {
                            //no more node...
                        }
                    }, this));
                }
            }, this);
        },
        selectHost: function(targetPageLoader) {
            // rely on YUI widget parent/child selection stuff
            var isSelected = '' + targetPageLoader.get('pageId') === '' + this._subpage();
            var host = this.get(HOST);
            host.set('selected', isSelected ? 2 : 0);

            // but also set custom class since parent/child selection does not work on others hots than buttons
            host.get("boundingBox").toggleClass("wegas-page-selected", isSelected);
        },
        execute: function() {
            var targetPageLoader = this._getTargetPageLoader();
            if (!targetPageLoader || this.get(HOST).get('disabled')) {
                return;
            }
            /*
             * Changing a page may call a page destructor and thus destroying other Action assossiated with this 'targetEvent'
             * in case this' host belongs to destructed page. That's the reason to delay a page change
             */
            this.handlers.push(Y.soon(Y.bind(function(pageLoader) {
                var subpage = this._subpage();

                if (pageLoader.get("pageId") === subpage) {
                    if (this.get("forceReload")) {
                        pageLoader.reload();
                    }
                } else {
                    pageLoader.set('pageId', subpage);
                }
            }, this, targetPageLoader)));
        },
        _getTargetPageLoader: function() {
            var targetPageLoader, plID = this.get('targetPageLoaderId');
            switch (plID) {
                case PAGELOADER_CONFIG.FULL_PAGE.value:
                    targetPageLoader = Wegas.PageLoader.find(
                        PREVIEW_PAGELOADER_ID
                        );
                    break;
                case PAGELOADER_CONFIG.CURRENT_PAGE_LOADER.value:
                    targetPageLoader = Y.Widget.getByNode(
                        this.get(HOST)
                        .get('root')
                        .get('boundingBox')
                        .ancestor()
                        );
                    break;
                default:
                    targetPageLoader = Wegas.PageLoader.find(plID);
            }
            return targetPageLoader;
        },
        _subpage: function() {
            if (this.get('variable.content')) {
                var variable = this.get('variable.evaluated');
                if (variable) {
                    return variable.getInstance().get('value');
                }
            }
            return this.get('subpageId');
        }
    }, {
        NS: 'OpenPageAction',
        ATTRS: {
            subpageId: {
                type: 'string',
                view: {
                    label: 'Open page',
                    type: 'pageselect'
                }
            },
            targetPageLoaderId: {
                type: 'string',
                value: '',
                view: {
                    label: 'Target',
                    type: 'pageloaderselect',
                    choices: [
                        PAGELOADER_CONFIG.FULL_PAGE,
                        PAGELOADER_CONFIG.CURRENT_PAGE_LOADER
                    ]
                }
            },
            forceReload: {
                type: 'boolean',
                value: false,
                view: {
                    type: 'boolean',
                    label: "Force page reload",
                    className: 'wegas-advanced-feature'
                }
            },
            variable: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    className: 'wegas-advanced-feature'
                }
            }
        }
    });
    Plugin.OpenPageAction = OpenPageAction;

    /**
     *  @class
     *  @name Y.Plugin.ExecuteScriptAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var ExecuteScriptAction = Y.Base.create('ExecuteScriptAction', Action, [], {
        execute: function() {
            if (!this.get(HOST).get('disabled')) {
                Wegas.Panel.confirmPlayerAction(
                    Y.bind(function() {
                        this.showOverlay();
                        Wegas.Facade.Variable.script.remoteEval(
                            this.get('onClick'),
                            {
                                on: {
                                    success: Y.bind(function() {
                                        this.hideOverlay();
                                    }, this),
                                    failure: Y.bind(this.hideOverlay, this)
                                }
                            }
                        );
                    }, this)
                    );
            }
        }
    }, {
        NS: 'ExecuteScriptAction',
        ATTRS: {
            onClick: {
                type: 'object',
                value: {},
                view: {
                    type: 'script',
                    label: 'On click'
                }
            }
        }
    });
    Plugin.ExecuteScriptAction = ExecuteScriptAction;

    /**
     *  @class
     *  @name Y.Plugin.ExecuteLocalScriptAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var ExecuteLocalScriptAction = Y.Base.create('ExecuteLocalScriptAction', Action, [], {
        execute: function() {
            if (!this.get(HOST).get('disabled')) {
                Wegas.Panel.confirmPlayerAction(
                    Y.bind(function() {
                        Wegas.Facade.Variable.script.localEval(this.get('onClick'));
                    }, this));
            }
        }
    }, {
        NS: 'ExecuteLocalScriptAction',
        ATTRS: {
            onClick: {
                type: 'string',
                value: "",
                view: {
                    type: 'textarea',
                    label: 'On click'
                }
            }
        }
    });
    Plugin.ExecuteLocalScriptAction = ExecuteLocalScriptAction;

    /**
     *  @class
     *  @name Y.Plugin.PlaySoundAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var PlaySoundAction = Y.Base.create('PlaySoundAction', Action, [], {
        execute: function() {
            var audio, url;
            url = Y.Plugin.Injector.getImageUri(this.get('url'));

            if (Y.Lang.isFunction(window.Audio)) {
                audio = new Audio(url);
                audio.play();
            } else {
                new Wegas.Panel({
                    bodyContent: '<div class=\'\'> <span class="fa fa-4x fa-bullhorn"></span> <span>Please listen to that <a target="_blank" href="' +
                        url +
                        '">sound</a>. <br /><br /><p style="font-size: 0.6em;color: rgba(153, 153, 153, 0.99);">(And, btw, upgrade your browser...)</p><span></div>'
                }).render();
            }
        }
    }, {
        NS: 'PlaySoundAction',
        ATTRS: {
            url: {
                value: '',
                type: 'string',
                view: {
                    label: 'Sound',
                    type: 'wegasurl'
                }
            }
        }
    });
    Plugin.PlaySoundAction = PlaySoundAction;

    /**
     *  @class
     *  @name Y.Plugin.ConfirmExecuteScriptAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var ConfirmExecuteScriptAction = Y.Base.create('ConfirmExecuteScriptAction',
        ExecuteScriptAction, [], {
        execute: function() {
            if (!this.get(HOST).get('disabled')) {
                Wegas.Panel.confirm(
                    I18n.tVar(this.get("messageVariable.evaluated"), this.get("message")),
                    Y.bind(ConfirmExecuteScriptAction.superclass.execute, this));
            }
        }
    }, {
        NS: 'ExecuteScriptAction',
        ATTRS: {
            message: {
                type: 'string',
                value: '',
                view: {
                    label: 'Message'
                }
            },
            messageVariable: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Variable',
                    classFilter: ['TextDescriptor', 'StringDescriptor',
                        'ListDescriptor', 'StaticTextDescriptor']
                }
            },
        }
    });
    Plugin.ConfirmExecuteScriptAction = ConfirmExecuteScriptAction;


    var ConfirmClick = Y.Base.create('wegas-confirm-click', Plugin.Base,
        [Wegas.Plugin, Wegas.Editable], {
        initializer: function() {
            var handle = this.get("host").get("contentBox").on("click", this.beforeEvent, this);
            this._handles.push(handle);
        },
        beforeEvent: function(e) {
            if (!this.get(HOST).get('disabled')) {
                if (e._event.hasOwnProperty("isTrusted") && window.MouseEvent) {
                    if (e._event.isTrusted) {
                        // User click: event not yet confirmed : stop it ASAP
                        Y.log("Event intercepted");
                        e.halt(true);
                        Y.Wegas.Panel.confirm(this._getMessage(), Y.bind(function() {
                            // Click confirmed -> fire event again but from the widget, not the contentBox !
                            var event = new MouseEvent('click', {
                                'view': window,
                                'bubbles': true,
                                'cancelable': true
                            });
                            e.target.getDOMNode().dispatchEvent(event);
                        }, this));
                    } else {
                        Y.log("Event Confirmed :" + e);
                    }
                } else {
                    // compatibility
                    if (!window.confirm(this._getMessage())) {
                        e.halt(true);
                    }
                }
            }
        },
        _getMessage: function() {
            var msgVar = this.get("variable.evaluated");
            var msgValue = msgVar && msgVar.getValue && msgVar.getValue();
            if (msgValue) {
                return msgValue;
            } else {
                return this.get("message");
            }
        }
    }, {
        NS: 'confirmallaction',
        EDITORNAME: 'Click Confirmation',
        ATTRS: {
            message: {
                type: "string",
                value: "Confirm Action ?",
                view: {
                    label: "Message"
                }
            },
            variable: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Message Variable',
                    description: "Override static message",
                    classFilter: ['StringDescriptor', 'TextDescriptor'],
                    className: "wegas-advanced-feature"
                }
            }
        }
    });
    Plugin.ConfirmClick = ConfirmClick;

    /**
     *  @class
     *  @name Y.Plugin.SaveObjectAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var SaveObjectAction = Y.Base.create('SaveObjectAction', Action, [], {
        execute: function(e) {
            var overlayGuest,
                i,
                host = this.get(HOST),
                guest = host.get('root'),
                variable = this.get('variable.evaluated'),
                //data = "var objProp = Variable.find(gameModel, \"" + variable.get("name") + "\").getInstance(self)" + ".properties;",
                //script = data + (this.get("clearStorage") ? "objProp.clear();" : "");
                data =
                'var instance = Variable.find(gameModel, "' +
                variable.get('name') +
                '").getInstance(self);',
                script =
                data +
                (this.get('clearStorage')
                    ? 'instance.clearProperties();'
                    : '');

            if (guest.showOverlay && guest.hideOverlay) {
                overlayGuest = guest;
                overlayGuest.showOverlay();
            }

            for (i in e.value) {
                script +=
                    "instance.setProperty('" +
                    (i + '').replace(/'/g, "\\'") +
                    "','" +
                    (e.value[i] + '').replace(/'/g, "\\'") +
                    "');";
                //script += "objProp.put('" + (i + "").replace(/'/g, "\\'") + "','" + (e.value[i] + "").replace(/'/g, "\\'") + "');";
            }

            Wegas.Facade.Variable.script.run(script, {
                on: {
                    success: function() {
                        overlayGuest && overlayGuest.hideOverlay();
                    },
                    failure: function() {
                        overlayGuest && overlayGuest.hideOverlay();
                    }
                }
            });
        }
    }, {
        NS: 'SaveObjectAction',
        EDITORNAME: 'Save to',
        ATTRS: {
            variable: {
                /**
                 * The target variable, returned either based on the name attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Save to',
                    classFilter: ['ObjectDescriptor']
                }
            },
            targetEvent: {
                value: 'submit',
                view: {
                    label: 'Target event',
                    className: 'wegas-advanced-feature'
                }
            },
            clearStorage: {
                type: 'boolean',
                value: true,
                view: {
                    label: 'Replace Storage',
                    description: 'Will remove existing data. Else add them to the existing one.'
                }
            }
        }
    });
    Plugin.SaveObjectAction = SaveObjectAction;


    var IdleMonitor = Y.Base.create('wegas-idleMonitor', Plugin.Base, [Wegas.Plugin], {
        initializer: function() {
            this.handlers = {};
            this.running = false;
            this.idle = false;
        },
        destructor: function() {
            this.stop();
        },
        isRunning: function() {
            return this.running;
        },
        isIdle: function() {
            return this.idle;
        },
        start: function() {
            if (!this.running) {
                this.running = true;

                this.handlers.mouseMove = Y.on("mousemove", Y.bind(this._onEvent, this));
                this.handlers.mousedown = Y.on("mousedown", Y.bind(this._onEvent, this));

                this.handlers.click = Y.on("click", Y.bind(this._onEvent, this));
                this.handlers.touchestart = Y.on("touchestart", Y.bind(this._onEvent, this));

                this.handlers.keypress = Y.on("keypress", Y.bind(this._onEvent, this));
                this.onScroll = Y.bind(this._onEvent, this);
                window.addEventListener('scroll', this.onScroll, true);

                this._reset();
                this.timerId = setInterval(Y.bind(this._incrementTimer, this), this.get("resolution"));
            }
        },
        _incrementTimer: function() {
            if (!this.idle) {
                this.counter += this.get("resolution");
                this._log("Check idle: " + this.counter + "/" + this.get("timeout"));
                if (this.counter >= this.get("timeout")) {
                    this._log("IDLE");
                    this.fire("idle");
                    this.idle = true;
                }
            }
        },
        _onEvent: function(e) {
            this._reset();
        },
        _reset: function() {
            this.counter = 0;
            if (this.idle) {
                this._log("RESUME");
                this.idle = false;
                this.fire("resume");
            }
        },
        _log: function(msg) {
            Y.log(msg);
        },
        stop: function() {
            this._reset();

            clearTimeout(this.timerId);

            this.running = false;
            this.idle = false;


            for (var key in this.handlers) {
                this.handlers[key].detach();
            }
            window.removeEventListener("scroll", this.onScroll);
        }

    }, {
        NS: "idlemonitor",
        ATTRS: {
            timeout: {
                // idle after milliseconds
                type: "number",
                value: 20000
            },
            resolution: {
                // check idle status each milliseconds
                type: "number",
                value: 5000
            }
        }
    });
    Plugin.IdleMonitor = IdleMonitor;

    var ScrollOnClick = Y.Base.create('wegas-scroll-onclick',
        Plugin.Base,
        [Wegas.Plugin, Wegas.Editable], {
        initializer: function() {
            this.handlers = {};
            this.get("host").get("contentBox").delegate("click", this.onClick, this.get("handle"), this);
        },
        onClick: function(e) {
            var host = this.get("host"),
                hostCb = host.get("contentBox"),
                handles = hostCb.all(this.get("handle")),
                targets = hostCb.all(this.get("target"));

            e.currentTarget;
            var i;
            var theTarget;
            for (i = 0; i < handles._nodes.length; i++) {
                if (handles._nodes[i] === e.currentTarget.getDOMNode()) {
                    if (this.get("direction") === "forward") {
                        theTarget = targets._nodes[i + 1];
                    } else {
                        theTarget = targets._nodes[i];
                    }
                    if (theTarget) {
                        if (this.get("scrollDirection") === "horizontal") {
                            var delta = theTarget.getBoundingClientRect().left
                                - hostCb.getDOMNode().getBoundingClientRect().left;
                            hostCb.getDOMNode().scrollLeft += delta;
                        } else {
                            var delta = theTarget.getBoundingClientRect().top
                                - hostCb.getDOMNode().getBoundingClientRect().top;
                            hostCb.getDOMNode().scrollTop += delta;
                        }
                        break;
                    }
                }
            }

        },
        destructor: function() {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
        }
    },
        {
            NS: "scrollonclick",
            ATTRS: {
                target: {
                    type: "string",
                    view: {
                        label: "Target Selector"
                    }
                },
                handle: {
                    type: "string",
                    view: {
                        label: "Handle Selector"
                    }
                },
                scrollDirection: {
                    value: 'vertical',
                    type: "string",
                    view: {
                        type: 'select',
                        choices: ['vertical', 'horizontal']
                    }
                },
                direction: {
                    value: 'forward',
                    type: "string",
                    view: {
                        type: 'select',
                        choices: ['forward', 'backward']
                    }
                }
            }
        }
    );
    Plugin.ScrollOnClick = ScrollOnClick;

    Plugin.ScrollOnClick2 = Y.Base.create('wegas-scroll-onclick2', ScrollOnClick, [], {}, {NS: 'ScrollOnClick2'});
    Plugin.ScrollOnClick3 = Y.Base.create('wegas-scroll-onclick3', ScrollOnClick, [], {}, {NS: 'ScrollOnClick3'});
    Plugin.ScrollOnClick4 = Y.Base.create('wegas-scroll-onclick3', ScrollOnClick, [], {}, {NS: 'ScrollOnClick4'});
});
