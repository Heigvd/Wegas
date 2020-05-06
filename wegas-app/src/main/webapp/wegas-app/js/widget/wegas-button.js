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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-button', function(Y) {
    'use strict';
    var CONTENTBOX = 'contentBox',
        BOUNDINGBOX = 'boundingBox',
        Wegas = Y.Wegas,
        Button,
        ToggleButton,
        MarkAsUnread;

    /**
     * @name Y.Wegas.Button
     * @extends Y.Button
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class Custom Button implementation.
     * @constructor
     * @description Custom Button implementation. Adds Y.WidgetChild and
     * Y.Wegas.Widget extensions to the original Y.Button
     */
    Button = Y.Base.create('button', Y.Button,
        [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
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

            this.publish('click', {
                emitFacade: true,
                bubbles: true,
                defaultFn: function() {
                    // Force event activation by default
                }
            });
            //this.constructor.CSS_PREFIX = "yui3-button";                      // Revert changes done by Y.Wegas.Widget so styling will work
            this._cssPrefix = 'yui3-button';

            if (this.get('cssClass')) {
                this.get(CONTENTBOX).addClass(this.get('cssClass'));
            }

            if (this.get('tooltip')) {
                this.plug(Y.Plugin.Tooltip, {
                    content: Y.Template.Micro.compile(this.get('tooltip'))()
                });
            }
        },
        getEditorLabel: function() {
            return Wegas.Helper.stripHtml(I18n.t(this.get('label')));
        },
        /**
         * @function
         * @private
         * @description Call widget parent to execute its proper render function.
         * add "wegas-button" class to bounding box.
         */
        renderUI: function() {
            Button.superclass.renderUI.apply(this, arguments);
            this.get(BOUNDINGBOX).addClass('wegas-button');
            /**
             * @hack backward compatibility hack
             * 
             * use the getter to convert untranslated / I18nV1 translation to I18nv2 translations
             * and use the setter to set the inner html
             * 
             */
            this.set("label", this.get("label"));
        },
        _getLabel: function(value) {
            return value;
        }
    }, {
        /**
         * @lends Y.Wegas.Button
         */
        EDITORNAME: 'Button',
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
            label: Y.Wegas.Helper.getTranslationAttr({
                label: "Label",
                type: "string"
            }),
            labelHTML: {
                transient: true
            },
            data: {
                view: {
                    type: 'hidden'
                }
            },
            tooltip: {
                type: 'string',
                optional: true,
                transient: true
            },
            disabled: {
                type: 'boolean',
                view: {
                    label: 'disabled',
                    className: 'wegas-advanced-feature'
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
            var text;
            if (label instanceof
                Y.Wegas.persistence.TranslatableContent || (typeof label === "object" && label["@class"] === "TranslatableContent")) {
                text = I18n.t(label);
            } else {
                text = label;
            }
            this.set('labelHTML', Y.Template.Micro.compile(text || '')(), {
                src: 'internal'
            });
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
    var UnreadCount = Y.Base.create('UnreadCount', Y.Plugin.Base,
        [Wegas.Plugin, Wegas.Editable], {
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
                InboxDescriptor: function(descriptor, instance, resolve) {
                    resolve(instance.get('unreadCount'));
                },
                DialogueDescriptor: function(descriptor, instance, resolve) {
                    var state = descriptor.getCurrentState();
                    if (!instance.get('enabled')) {
                        return false;
                    }
                    state.getAvailableActions(function(availableActions) {
                        resolve(availableActions.length > 0 ? 1 : 0);
                    });
                },
                QuestionDescriptor: function(descriptor, instance, resolve) {
                    if (descriptor.get('cbx')) {
                        resolve(instance.get('active') && !instance.get('validated') ? 1 : 0); // only count if it is active
                    } else {
                        var replies = Y.Array.filter(instance.get('replies'), function(reply) {
                            return reply.get("validated");
                        });

                        if (replies) {
                            resolve(replies.length === 0 && !instance.get('validated') && instance.get('active') ? 1 : 0); // only count if it is active
                        } else {
                            resolve(0);
                        }
                    }
                },
                WhQuestionDescriptor: function(descriptor, instance, resolve) {
                    resolve((instance.get('active') && !instance.get("validated") ? 1 : 0));
                },
                SurveyDescriptor: function(descriptor, instance, resolve) {
                    resolve((instance.get('active') && !instance.get("validated") ? 1 : 0));
                },
                PeerReviewDescriptor: function(descriptor, instance, resolve) {
                    var i, j, k,
                        types = ['toReview', 'reviewed'],
                        reviews,
                        review,
                        counter = 0;

                    for (i = 0; i < 2; i++) {
                        reviews = instance.get(types[i]);
                        for (j = 0; j < reviews.length; j++) {
                            review = reviews[j];
                            if ((i === 0 && review.get('reviewState') === 'DISPATCHED') ||
                                (i === 1 && review.get('reviewState') === 'NOTIFIED')) {
                                counter++;
                            }
                        }
                    }
                    resolve(counter);
                }
            };
            for (k in this.get('userCounters')) {
                var theFunction = this.get('userCounters')[k];
                if (theFunction instanceof Function === false) {
                    theFunction = eval('(' + theFunction + ')');
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
            this.handlers.update = Wegas.Facade.Variable.after('update', this.syncUI, this);
            this.afterHostEvent('render', this.syncUI, this);
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
            var bb = this.get('host').get(BOUNDINGBOX);
            //target = bb.one('> .wegas-unreadcount');

            if (!this.target) {
                // If the counter span has not been rendered, do it
                this.target = bb.appendChild('<span class="wegas-unreadcount wegas-unreadcounter wegas-unreadcount-' + this.constructor.NS + '"></span>');
            }

            if (unreadCount > 0) {
                // Update the content, but only if necessary, to enable targeted CSS animations
                var span = this.target.one("span"),
                    oldval = span && span.getData("value");
                oldval = oldval ? +oldval : -1;
                if (oldval !== unreadCount) {
                    this.target.setContent("<span class='value' data-value='" + unreadCount + "'>" +
                        (this.get('displayValue') ? unreadCount : '') +
                        '</span>');
                    bb.addClass('wegas-unreadcount wegas-unreadcount-' + this.constructor.NS);

                    if (!this.toggled) {
                        var nbCounter = +bb.getAttribute("data-nb-counter") || 0;
                        bb.setAttribute("data-nb-counter", nbCounter + 1); // inform others unreadCounterss
                        this.toggled = true;
                    }
                }
            } else {
                this.target.setContent('');
                var nbCounter = +bb.getAttribute("data-nb-counter");
                bb.removeClass('wegas-unreadcount-' + this.constructor.NS);
                if (nbCounter === 1) {
                    // was the last couter
                    bb.removeClass('wegas-unreadcount');
                    bb.setAttribute("data-nb-counter", 0);
                    this.toggled = false;
                } else if (nbCounter > 1) {
                    bb.setAttribute("data-nb-counter", nbCounter - 1);
                }
            }
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
        /**
         * @function
         * @private
         * @return Number of unread.
         * @description Count the number of unread reply in given variable.
         */
        updateCounter: function() {
            var i,
                /*messages,*/ items,
                count = 0,
                klass,
                branches = this.get('variable.evaluated'),
                descriptor,
                context = this,
                branchPromises = [],
                promises = [];

            if (!branches) {
                return 0;
            }

            if (branches && branches.get && branches.get("@class") === "ListDescriptor") {
                branches = branches.get("items");
            }

            if (!Y.Lang.isArray(branches)) {
                branches = [branches];
            }

            for (var branch in branches) {
                var list = branches[branch];
                if (!Y.Lang.isArray(list)) {
                    list = [list];
                }
                branchPromises.push([]);
                descriptor = list.pop();
                while (descriptor) {
                    klass = descriptor.get('@class');
                    if (klass === 'ListDescriptor') {
                        items = descriptor.flatten();
                        for (i = 0; i < items.length; i = i + 1) {
                            list.push(items[i]);
                        }
                    } else {
                        if (this._counters[klass]) {
                            branchPromises[branch].push(
                                new Y.Promise(function(resolve, reject) {
                                    var fcn;
                                    if (context._counters[klass] instanceof Function) {
                                        fcn = context._counters[klass];
                                    } else {
                                        fcn = eval('(' + context._counters[klass] + ')');
                                    }

                                    fcn.call(context, descriptor, descriptor.getInstance(),
                                        function(count) {
                                            resolve(count);
                                        }
                                    );
                                }));
                        }
                    }

                    descriptor = list.pop();
                }

                promises.push(new Y.Promise(Y.bind(function(resolve, reject) {
                    Y.Promise.all(branchPromises[branch]).then(Y.bind(function(allCounts) {
                        var total = 0, i;
                        for (i = 0; i < allCounts.length; i += 1) {
                            total += allCounts[i];
                        }
                        if (this.get("onePerBranch")) {
                            resolve(total > 0 ? 1 : 0);
                        } else {
                            resolve(total);
                        }
                    }, this));
                }, this)));
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
        NS: 'UnreadCount',
        NAME: 'UnreadCount',
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
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Unread count',
                    classFilter: ['ListDescriptor', 'InboxDescriptor']
                }
            },
            displayValue: {
                type: 'boolean',
                optional: true,
                value: true,
                view: {
                    label: "Display value"
                }
            },
            userCounters: {
                type: 'object',
                value: {},
                optional: true,
                view: {
                    type: 'hidden'
                }
            },
            onePerBranch: {
                type: "boolean",
                value: false,
                view: {
                    label: "Per subfolder",
                    description: "Count a maximum of one for each subfolder"
                }
            }
        }
    });
    Y.Plugin.UnreadCount = UnreadCount;

    MarkAsUnread = Y.Base.create('wegas-mark-as-unread', Y.Plugin.UnreadCount, [], {
        setCounterValue: function(unreadCount) {
            if (unreadCount > 0) {
                if (this.get('host') instanceof Y.Node) {
                    this.get('host').addClass('unread');
                } else if (this.get('host') instanceof Y.Widget) {
                    this.get('host').get('boundingBox').addClass('unread');
                } else {
                    Y.log('unread error...');
                }
            }
        }
    }, {
        NS: 'MarkAsUnread',
        NAME: 'MarkAsUnread',
        ATTRS: {}
    });
    Y.Plugin.MarkAsUnread = MarkAsUnread;

    /**
     * @name Y.Wegas.OpenPageButton
     * @extends Y.Wegas.Button
     * @class Shortcut to create a Button with an OpenPageAction plugin
     * @constructor
     * @description Shortcut to create a Button with an OpenPageAction plugin
     */
    Wegas.OpenPageButton = Y.Base.create('button', Wegas.Button, [], {
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

    Wegas.ToggleButton = Y.Base.create('button', Y.ToggleButton, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {}, {}
    );
});
