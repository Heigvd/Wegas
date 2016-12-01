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
YUI.add("wegas-button", function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
        BOUNDINGBOX = 'boundingBox',
        Wegas = Y.Wegas, Button, ToggleButton, MarkAsUnread;

    /**
     * @name Y.Wegas.Button
     * @extends Y.Button
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class Custom Button implementation.
     * @constructor
     * @description Custom Button implementation. Adds Y.WidgetChild and
     * Y.Wegas.Widget extensions to the original Y.Button
     */
    Button = Y.Base.create("button", Y.Button, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.Button# */
        // *** Private fields *** //

        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description Set variable with initials values.
         * Plug tooltip add given (by ATTRS) css class to contentbox
         */
        initializer: function() {
            Button.superclass.initializer.apply(this, arguments);

            this.publish("click", {
                emitFacade: true,
                bubbles: true,
                defaultFn: function() {                                         // Force event activation by default
                }
            });
            //this.constructor.CSS_PREFIX = "yui3-button";                      // Revert changes done by Y.Wegas.Widget so styling will work
            this._cssPrefix = "yui3-button";

            if (this.get("cssClass")) {
                this.get(CONTENTBOX).addClass(this.get("cssClass"));
            }

            if (this.get("tooltip")) {
                this.plug(Y.Plugin.Tooltip, {
                    content: Y.Template.Micro.compile(this.get("tooltip"))()
                });
            }
        },
        getEditorLabel: function() {
            return Wegas.Helper.stripHtml(this.get("label"));
        },
        /**
         * @function
         * @private
         * @description Call widget parent to execute its proper render function.
         * add "wegas-button" class to bounding box.
         */
        renderUI: function() {
            Button.superclass.renderUI.apply(this, arguments);
            this.get(BOUNDINGBOX).addClass("wegas-button");
        },
        _getLabel: function(value) {
            return value;
        }
    }, {
        /**
         * @lends Y.Wegas.Button
         */
        EDITORNAME: "Button",
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>label: the label of the button</li>
         *    <li>data: the data used by the button</li>
         *    <li>tooltip: the tooltip of the button</li>
         *    <li>disabled: boolean to choose state of the button</li>
         *    <li>cssClass: cssClass of the button</li>
         *    <li>plugins: impact to bind at the buttons</li>
         * </ul>
         */
        ATTRS: {
            label: {
                type: "string",
                optional: true
            },
            labelHTML: {
                "transient": true
            },
            data: {},
            tooltip: {
                type: "string",
                optional: true,
                "transient": true
            },
            disabled: {
                type: "boolean",
                _inputex: {
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            },
            cssClass: {
                value: null
            }
        }
    });
    Wegas.Button = Button;

    /* @fixme @hack So we can display html tag inside a button */
    Y.Button.prototype._setLabel = function(label, name, opts) {
        if (!opts || opts.src !== 'internal') {
            this.set('labelHTML', Y.Template.Micro.compile(label || "")(), {src: 'internal'});
        }
        return label;
    };

    /**
     * Plugin which adds an unread message counter to a widget.
     *
     * @class Y.Wegas.UnreadCount
     * @extends Y.Plugin.Base
     * @borrows Y.Wegas.Plugin, Y.Wegas.Editable
     */
    var UnreadCount = Y.Base.create("wegas-unreadCount", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.UnreadCount# */

        // *** Private fields *** //
        // *** Lifecycle methods *** //
        /**
         * @function
         * @private
         * @description Set variable with initials values.
         */
        initializer: function() {
            var k;
            this.handlers = {};
            this._counters = {
                "InboxDescriptor": function(descriptor, instance, resolve) {
                    resolve(instance.get("unreadCount"));
                },
                "DialogueDescriptor": function(descriptor, instance, resolve) {
                    var state = descriptor.getCurrentState();
                    if (!instance.get("enabled")) {
                        return false;
                    }
                    state.getAvailableActions(function(availableActions) {
                        resolve(availableActions.length > 0 ? 1 : 0);
                    });
                },
                "QuestionDescriptor": function(descriptor, instance, resolve) {
                    if (descriptor.get("cbx")) {
                        resolve(instance.get("active") && !instance.get("validated") ? 1 : 0); // only count if it is active
                    } else {
                        if (instance.get("replies")) {
                            resolve(instance.get("replies").length === 0 && instance.get("active") ? 1 : 0); // only count if it is active
                        } else {
                            resolve(0);
                        }
                    }
                },
                "PeerReviewDescriptor": function(descriptor, instance, resolve) {
                    var i, j, k, types = ["toReview", "reviewed"],
                        reviews, review,
                        counter = 0;

                    for (i = 0; i < 2; i++) {
                        reviews = instance.get(types[i]);
                        for (j = 0; j < reviews.length; j++) {
                            review = reviews[j];
                            if ((i === 0 && review.get("reviewState") === "DISPATCHED") ||
                                (i === 1 && review.get("reviewState") === "NOTIFIED")) {
                                counter++;
                            }
                        }
                    }
                    resolve(counter);
                }
            };
            for (k in this.get("userCounters")) {
                var theFunction = this.get("userCounters")[k];
                if (!theFunction instanceof Function) {
                    theFunction = eval("(" + theFunction + ")");
                }
                this._counters[k] = theFunction;
            }
            this.bindUI();
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When VariableDescriptorFacade is updated, do sync.
         * When plugin's host is render, do sync.
         */
        bindUI: function() {
            this.handlers.update = Wegas.Facade.Variable.after("update", this.syncUI, this);
            this.afterHostEvent("render", this.syncUI, this);
        },
        /**
         * @function
         * @private
         * @description call function 'getUnreadCount' to set the number of
         * unread on the host.
         */
        syncUI: function() {
            this.updateCounter();
        },
        setCounterValue: function(unreadCount) {
            var bb = this.get('host').get(BOUNDINGBOX),
                target = bb.one(".wegas-unreadcount");

            if (!target) {                                                      // If the counter span has not been rendered, do it
                bb.append('<span class="wegas-unreadcount"></span>');
                target = bb.one(".wegas-unreadcount");
            }

            if (unreadCount > 0) {                                              // Update the content
                target.setContent("<span class='value'>" + (this.get("displayValue") ? unreadCount : "") + "</span>");
            } else {
                target.setContent("");
            }
            bb.toggleClass("wegas-unreadcount", unreadCount > 0);
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget
         */
        destructor: function() {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
        },
        // *** Private methods *** //
        /**
         * @function
         * @private
         * @return Number of unread.
         * @description Count the number of unread reply in given variable.
         */
        updateCounter: function() {
            var i, instance, /*messages,*/ items, count = 0, klass,
                list = this.get('variable.evaluated'), descriptor, context = this, promises = [];

            if (!list) {
                return 0;
            }

            if (!Y.Lang.isArray(list)) {
                list = [list];
            }

            descriptor = list.pop();
            while (descriptor) {
                klass = descriptor.get("@class");
                if (klass === "ListDescriptor") {
                    items = descriptor.flatten();
                    for (i = 0; i < items.length; i = i + 1) {
                        list.push(items[i]);
                    }
                } else {
                    if (this._counters[klass]) {
                        promises.push(new Y.Promise(function(resolve, reject) {
                            var fcn;
                            if (context._counters[klass] instanceof  Function) {
                                fcn = context._counters[klass]
                            } else {
                                fcn = eval("(" + context._counters[klass] + ")");
                            }

                            fcn.call(context, descriptor, descriptor.getInstance(), function(count) {
                                resolve(count);
                            });
                        }));
                    }
                }

                descriptor = list.pop();
            }

            Y.Promise.all(promises).then(function(allCounts) {
                var total = 0, i;
                for (i = 0; i < allCounts.length; i += 1) {
                    total += allCounts[i];
                }
                context.setCounterValue(total);
            });
        }
    }, {
        NS: "UnreadCount",
        NAME: "UnreadCount",
        /**
         * @lends Y.Plugin.UnreadCount
         */
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>variable: The target variable, returned either based on the name
         *     attribute, and if absent by evaluating the expr attribute.</li>
         * </ul>
         */
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Unread count",
                    classFilter: ["ListDescriptor", "InboxDescriptor"]
                }
            },
            displayValue: {
                type: "boolean",
                optional: true,
                value: true
            },
            userCounters: {
                type: "object",
                value: {},
                optional: true,
                _inputex: {
                    type: "hidden"
                }
            }
        }
    });
    Y.Plugin.UnreadCount = UnreadCount;

    MarkAsUnread = Y.Base.create("wegas-mark-as-unread", Y.Plugin.UnreadCount, [], {
        setCounterValue: function(unreadCount) {
            if (unreadCount > 0) {
                if (this.get("host") instanceof Y.Node) {
                    this.get("host").addClass("unread");
                } else if (this.get("host") instanceof Y.Widget) {
                    this.get("host").get("boundingBox").addClass("unread");
                } else {
                    Y.log("unread error...");
                }
            }
        }
    }, {
        NS: "MarkAsUnread",
        NAME: "MarkAsUnread",
        ATTRS: {
        }
    });
    Y.Plugin.MarkAsUnread = MarkAsUnread;



    /**
     * @name Y.Wegas.OpenPageButton
     * @extends Y.Wegas.Button
     * @class Shortcut to create a Button with an OpenPageAction plugin
     * @constructor
     * @description Shortcut to create a Button with an OpenPageAction plugin
     */
    Wegas.OpenPageButton = Y.Base.create("button", Wegas.Button, [], {
        /** @lends Y.Wegas.OpenPageButton# */
        /**
         * @function
         * @private
         * @param cfg
         * @description plug the plugin "OpenPageAction" with a given
         *  configuration.
         */
        initializer: function(cfg) {
            this.plug(Y.Plugin.OpenPageAction, cfg);
        }
    });

    Wegas.ToggleButton = Y.Base.create("button", Y.ToggleButton, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {}, {});
});
