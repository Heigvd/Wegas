/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-tooltip', function(Y) {
    'use strict';
    var Wegas = Y.Wegas,
        TooltipPlg,
        Tooltip,
        Lang = Y.Lang,
        Node = Y.Node,
        OX = -10000,
        OY = -10000;

    /**
     *  @class To be pluged on a Y.Widget to display a tooltip on mouseover
     *  @name Y.Plugin.Tooltip
     *  @extends Y.Plugin.Base
     *  @augments Y.Wegas.Plugin
     *  @augments Y.Wegas.Editable
     *  @constructor
     */
    TooltipPlg = Y.Base.create(
        'Tooltip',
        Y.Plugin.Base,
        [Wegas.Plugin, Wegas.Editable],
        {
            /** @lends Y.Plugin.Tooltip# */

            /**
             * @function
             * @private
             */
            initializer: function() {
                var host = this.get('host');
                this.node = host.get('boundingBox') || host;
                Tooltip.getInstance().addTriggerNode(
                    this.node,
                    this.get('content')
                    );
            },
            /**
             * 
             */
            destructor: function() {
                Tooltip.getInstance().removeTriggerNode(this.node);
            }
        },
        {
            /** @lends Y.Plugin.Tooltip */

            NS: 'Tooltip',
            NAME: 'Tooltip',
            /*
             * <p><strong>Config attributes</strong></p>
             * <ul>
             *    <li>content: the value of the tooltip</li>
             * </ul>
             * @field
             * @static
             */
            ATTRS: {
                content: {
                    type: 'string',
                    setter: function(val) {
                        Tooltip.getInstance().addTriggerNode(this.node, val);
                        return val;
                    },
                    view: {
                        type: 'html'
                    }
                }
            }
        }
    );
    Y.Plugin.Tooltip = TooltipPlg;

    /**
     *  @name Y.Plugin.Tooltip
     *  @extends Y.Widget
     *  @class An overlay that hides when mouse moves out of a target.
     *  @constructor
     */
    Tooltip = Y.Base.create(
        'tooltip',
        Y.Widget,
        [Y.WidgetPosition, Y.WidgetStack, Y.WidgetPositionConstrain],
        {
            /** @lends Y.Plugin.Tooltip# */
            // PROTOTYPE METHODS/PROPERTIES

            /*
             * Initialization Code: Sets up privately used state
             * properties, and publishes the events Tooltip introduces
             * @function
             * @private
             * @param {Object} widget attribute litteral
             */
            initializer: function() {
                this._currTrigger = {
                    // Currently bound trigger node information
                    node: null,
                    title: null,
                    mouseX: Tooltip.OFFSCREEN_X,
                    mouseY: Tooltip.OFFSCREEN_Y
                };

                this._eventHandles = {
                    // Event handles - mouse over is set on the delegate
                    delegate: null, // element, mousemove and mouseleave are set on the trigger node
                    trigger: {
                        mouseMove: null,
                        mouseOut: null
                    }
                };

                this._timers = {
                    // Show/hide timers
                    show: null,
                    hide: null
                };

                this.publish('tooltipShow', {
                });

                this.publish('triggerEnter', {
                    // Publish events introduced by Tooltip. Note the
                    defaultFn: this._defTriggerEnterFn, // triggerEnter event is preventable, with the default
                    preventable: true // behavior defined in the _defTriggerEnterFn method
                });
                this.publish('triggerLeave', {
                    preventable: false
                });
            },
            /*
             * Destruction Code: Clears event handles, timers,
             * and current trigger information
             * @function
             * @private
             */
            destructor: function() {
                this._clearCurrentTrigger();
                this._clearTimers();
                this._clearHandles();
            },
            /*
             * bindUI is used to bind attribute change and dom event
             * listeners
             * @function
             * @private
             */
            bindUI: function() {
                this.after('delegateChange', this._afterSetDelegate);
                this.after('nodesChange', this._afterSetNodes);

                this._bindDelegate();
            },
            /*
             * syncUI is used to update the rendered DOM, based on the current
             * Tooltip state
             * @function
             * @private
             */
            syncUI: function() {
                this._uiSetNodes(this.get('triggerNodes'));
            },
            /*
             * Public method, which can be used by triggerEvent event listeners
             * to set the content of the tooltip for the current trigger node
             * @function
             * @private
             */
            setTriggerContent: function(content) {
                var i, cb = this.get('contentBox');
                cb.setHTML('');

                if (content) {
                    if (content instanceof Node) {
                        for (i = 0; i < content.size(); ++i) {
                            cb.appendChild(content.item(i));
                        }
                    } else if (Lang.isString(content)) {
                        cb.set('innerHTML', content);
                        cb.all('img').once(
                            'load',
                            function() {
                                this.constrain();
                            },
                            this
                            );
                    }
                }
            },
            /**
             * @function
             * @private
             */
            addTriggerNode: function(node, content) {
                this.get('content')[node.get('id')] = content;
                this.get('triggerNodes').push(node);
                this.syncUI();
            },
            /**
             * @function
             * @private
             */
            removeTriggerNode: function(node) {
                delete this.get('content')[node.get('id')];
                if (this._currTrigger.node === node) {
                    this._leaveTrigger();
                }
                this.get('triggerNodes').push(node);
            },
            /*
             * Default attribute change listener for
             * the triggerNodes attribute
             * @function
             * @private
             */
            _afterSetNodes: function(e) {
                this._uiSetNodes(e.newVal);
            },
            /*
             * Default attribute change listener for
             * the delegate attribute
             * @function
             * @private
             */
            _afterSetDelegate: function(e) {
                this._bindDelegate(e.newVal);
            },
            /*
             * Updates the rendered DOM to reflect the
             * set of trigger nodes passed in
             * @function
             * @private
             */
            _uiSetNodes: function(nodes) {
                if (this._triggerNodes) {
                    this._triggerNodes.removeClass(
                        this.getClassName('trigger')
                        );
                }

                if (nodes) {
                    this._triggerNodes = nodes;
                    this._triggerNodes.addClass(this.getClassName('trigger'));
                }
            },
            /*
             * Attaches the default mouseover DOM listener to the
             * current delegate node
             * @function
             * @private
             */
            _bindDelegate: function() {
                var eventHandles = this._eventHandles;

                if (eventHandles.delegate) {
                    eventHandles.delegate.detach();
                    eventHandles.delegate = null;
                }

                eventHandles.delegate = Y.Wegas.Widget.wegasDelegate(
                    this.get('delegate'), 'mouseover',
                    this._onNodeMouseEnter, this.get('delegateSelect'), this);
            },
            /*
             * Default mouse enter DOM event listener.
             *
             * Delegates to the _enterTrigger method,
             * if the mouseover enters a trigger node.
             * @function
             * @private
             */
            _onNodeMouseEnter: function(e) {
                var node = e.currentTarget;
                if (
                    node &&
                    (!this._currTrigger.node ||
                        !node.compareTo(this._currTrigger.node))
                    ) {
                    this._enterTrigger(node, e.pageX, e.pageY);
                }
            },
            /*
             * Default mouse leave DOM event listener
             *
             * Delegates to _leaveTrigger if the mouse
             * leaves the current trigger node
             * @function
             * @private
             */
            _onNodeMouseLeave: function(e) {
                this._leaveTrigger(e.currentTarget);
            },
            /*
             * Default mouse move DOM event listener
             */
            _onNodeMouseMove: function(e) {
                this._overTrigger(e.pageX, e.pageY);
            },
            /*
             * Default handler invoked when the mouse enters
             * a trigger node. Fires the triggerEnter
             * event which can be prevented by listeners to
             * show the tooltip from being displayed.
             * @function
             * @private
             */
            _enterTrigger: function(node, x, y) {
                this._clearCurrentTrigger();
                this._setCurrentTrigger(node, x, y);
                this.fire('triggerEnter', {
                    node: node,
                    pageX: x,
                    pageY: y
                });
            },
            /*
             * Default handler for the triggerEvent event,
             * which will setup the timer to display the tooltip,
             * if the default handler has not been prevented.
             * @function
             * @private
             */
            _defTriggerEnterFn: function(e) {
                var delay, node = e.node;
                if (!this.get('disabled')) {
                    this._clearTimers();
                    delay = this.get('visible') ? 0 : this.get('showDelay');
                    this._timers.show = Y.later(delay, this, this._showTooltip, [node]);
                }
            },
            /*
             * Default handler invoked when the mouse leaves
             * the current trigger node. Fires the triggerLeave
             * event and sets up the hide timer
             * @function
             * @private
             */
            _leaveTrigger: function(node) {
                this.fire('triggerLeave');

                this._clearCurrentTrigger();
                this._clearTimers();
                this._hideTooltip();
                //            this._timers.hide = Y.later(this.get("hideDelay"), this, this._hideTooltip);
            },
            /*
             * Default handler invoked for mousemove events
             * on the trigger node. Stores the current mouse
             * x, y positions
             * @function
             * @private
             */
            _overTrigger: function(x, y) {
                this._currTrigger.mouseX = x;
                this._currTrigger.mouseY = y;
            },
            /*
             * Shows the tooltip, after moving it to the current mouse
             * position.
             * @function
             * @private
             */
            _showTooltip: function(node) {
                this.fire('tooltipShow', {
                    node: node
                });

                var x = this._currTrigger.mouseX, y = this._currTrigger.mouseY;

                this.move(x + Tooltip.OFFSET_X, y + Tooltip.OFFSET_Y);
                if (this.get('contentBox').getContent()) {
                    this.show();
                }
                this._clearTimers();

                this._timers.hide = Y.later(this.get('autoHideDelay'), this, this._hideTooltip);
            },
            /*
             * Hides the tooltip, after clearing existing timers.
             * @function
             * @private
             */
            _hideTooltip: function() {
                this._clearTimers();
                this.hide();
            },
            /*
             * Set the rendered content of the tooltip for the current
             * trigger, based on (in order of precedence):
             *
             * a). The string/node content attribute value
             * b). From the content lookup map if it is set, or
             * c). From the title attribute if set.
             * @function
             * @private
             */
            _setTriggerContent: function(node) {
                var content = this.get('content');
                if (
                    content &&
                    !(content instanceof Node || Lang.isString(content))
                    ) {
                    content =
                        content[node.get('id')] ||
                        unescape(node.getAttribute('title'));
                }
                this.setTriggerContent(content);
            },
            /*
             * Set the currently bound trigger node information, clearing
             * out the title attribute if set and setting up mousemove/out
             * listeners.
             * @function
             * @private
             */
            _setCurrentTrigger: function(node, x, y) {
                var title,
                    currTrigger = this._currTrigger,
                    triggerHandles = this._eventHandles.trigger;

                this._setTriggerContent(node);

                triggerHandles.mouseMove = Y.on(
                    'mousemove',
                    Y.bind(this._onNodeMouseMove, this),
                    node
                    );
                triggerHandles.mouseOut = Y.on(
                    'mouseleave',
                    Y.bind(this._onNodeMouseLeave, this),
                    node
                    );

                title = node.getAttribute('title');
                node.setAttribute('title', '');

                currTrigger.mouseX = x;
                currTrigger.mouseY = y;
                currTrigger.node = node;
                currTrigger.title = title;
            },
            /*
             * Clear out the current trigger state, restoring
             * the title attribute on the trigger node,
             * if it was originally set.
             * @function
             * @private
             */
            _clearCurrentTrigger: function() {
                var currTrigger = this._currTrigger,
                    triggerHandles = this._eventHandles.trigger;

                if (currTrigger.node) {
                    var node = currTrigger.node,
                        title = currTrigger.title || '';

                    currTrigger.node = null;
                    currTrigger.title = '';

                    triggerHandles.mouseMove.detach();
                    triggerHandles.mouseOut.detach();
                    triggerHandles.mouseMove = null;
                    triggerHandles.mouseOut = null;

                    node.setAttribute('title', title);
                }
            },
            /*
             * Cancel any existing show/hide timers
             * @function
             * @private
             */
            _clearTimers: function() {
                var timers = this._timers;
                if (timers.hide) {
                    timers.hide.cancel();
                    timers.hide = null;
                }
                if (timers.show) {
                    timers.show.cancel();
                    timers.show = null;
                }
            },
            /*
             * Detach any stored event handles
             * @function
             * @private
             */
            _clearHandles: function() {
                var eventHandles = this._eventHandles;

                if (eventHandles.delegate) {
                    this._eventHandles.delegate.detach();
                }
                if (eventHandles.trigger.mouseOut) {
                    eventHandles.trigger.mouseOut.detach();
                }
                if (eventHandles.trigger.mouseMove) {
                    eventHandles.trigger.mouseMove.detach();
                }
            }
        },
        {
            /** @lends Y.Wegas.Tooltip */
            // STATIC METHODS/PROPERTIES

            OFFSET_X: 15,
            OFFSET_Y: 15,
            OFFSCREEN_X: OX,
            OFFSCREEN_Y: OY,
            CSS_PREFIX: 'wegas-tooltip',
            /**
             * Retrieves a singleton of the tt instance.
             */
            getInstance: function() {
                if (!Tooltip.tt) {
                    Tooltip.tt = new Tooltip({
                        triggerNodes: new Y.NodeList(),
                        delegate: 'body',
                        content: {},
                        render: true
                    });
                }
                return Tooltip.tt;
            },
            /**
             *
             */
            ATTRS: {
                constrain: {
                    value: true
                },
                shim: {
                    value: false
                },
                zIndex: {
                    value: 100000
                },
                /*
                 * The tooltip content. This can either be a fixed content value,
                 * or a map of id-to-values, designed to be used when a single
                 * tooltip is mapped to multiple trigger elements.
                 */
                content: {
                    value: null
                },
                /*
                 * The set of nodes to bind to the tooltip instance. Can be a string,
                 * or a node instance.
                 */
                triggerNodes: {
                    value: null,
                    setter: function(val) {
                        if (val && Lang.isString(val)) {
                            val = Node.all(val);
                        }
                        return val;
                    }
                },
                /*
                 * The delegate node to which event listeners should be attached.
                 * This node should be an ancestor of all trigger nodes bound
                 * to the instance. By default the document is used.
                 */
                delegate: {
                    value: null,
                    setter: function(val) {
                        return Y.one(val) || Y.one('document');
                    }
                },
                /*
                 * The time to wait, after the mouse enters the trigger node,
                 * to display the tooltip
                 */
                showDelay: {
                    value: 600
                },
                /*
                 * The time to wait, after the mouse leaves the trigger node,
                 * to hide the tooltip
                 */
                hideDelay: {
                    value: 10
                },
                /*
                 * The time to wait, after the tooltip is first displayed for
                 * a trigger node, to hide it, if the mouse has not left the
                 * trigger node
                 */
                autoHideDelay: {
                    value: 10000
                },
                /*
                 * Override the default visibility set by the widget base class
                 */
                visible: {
                    value: false
                },
                /*
                 * Override the default XY value set by the widget base class,
                 * to position the tooltip offscreen
                 */
                xy: {
                    value: [OX, OY]
                },
                delegateSelect: {
                    value: null,
                    getter: function(val) {
                        return val || '.' + this.getClassName('trigger');
                    }
                }
            }
        }
    );
    Wegas.Tooltip = Tooltip;
});
