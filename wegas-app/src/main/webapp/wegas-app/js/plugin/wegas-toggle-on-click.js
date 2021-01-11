/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 *
 * @type type
 */
YUI.add('wegas-toggle-on-click', function(Y) {
    "use strict";

    var ToggleOnClick = Y.Base.create("wegas-toggle-on-click", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        _state: {
        },
        getState: function() {
            var stateName = this.get("stateName");
            if (stateName) {
                Y.Wegas.Config.ToggleOnClick = Y.Wegas.Config.ToggleOnClick || {};
                Y.Wegas.Config.ToggleOnClick[stateName] = Y.Wegas.Config.ToggleOnClick[stateName] || {};
                return Y.Wegas.Config.ToggleOnClick[stateName];
            } else {
                return this._state;
            }
        },
        restoreState: function() {
            var hostCb = this.get("host").get("contentBox");
            var key = this.get("parentSelector") || this.get("targetSelector");

            // for each potential toggled node
            hostCb.all(key).each(function(node) {
                var state = this.getState();
                for (var id in state) {
                    if (state[id]) {
                        // fetch all node which match the
                        var datatable = Y.Widget.getByNode(node);
                        if (datatable && datatable instanceof Y.DataTable) {
                            var record = datatable.getRecord(node);
                            if (record && record.get("id") === +id) {
                                node.addClass(this.get("className"));
                                break;
                            }
                        }
                    }
                }
            }, this);
        },
        onClick: function(e) {
            var widget = Y.Widget.getByNode(e.target);

            var pSelector = this.get("parentSelector");
            var toggleOn = pSelector ? e.target.ancestor(pSelector) : e.currentTarget;
            toggleOn.toggleClass(this.get("className"));

            if (widget instanceof Y.DataTable) {
                if (!this.afterRender) {
                    //this.afterRender = Y.Do.after(this.restoreState, widget, "syncUI", this);
                    //this.afterRender = widget.after("renderView", this.restoreState, this);
                    this.afterRender = this.afterHostMethod("syncUI", this.restoreState, this);
                }
                var record = widget.getRecord(e.target);

                if (record) {
                    var id = record.get("id");
                    var state = this.getState();
                    state[id] = !state[id];
                }
            }
        },
        initializer: function() {
            this.get("host").get("contentBox").delegate("click", this.onClick, this.get("targetSelector"), this);
            this.onceAfterHostEvent("render", this.restoreState, this);
        },
        destroy: function() {
            this.afterRender && this.afterRender.detach();
        }
    }, {
        NS: 'ToggleOnClick',
        ATTRS: {
            className: {
                type: 'string',
                value: '',
                view: {
                    label: 'Class to toggle'
                }
            },
            targetSelector: {
                type: 'string',
                value: '',
                view: {
                    label: 'Click on',
                    description: 'CSS selector'
                }
            },
            parentSelector: {
                type: 'string',
                value: '',
                view: {
                    label: 'Toggle class on first parent of target',
                    description: 'CSS ancestor selector'
                }
            },
            stateName: {
                type: 'string',
                value: '',
                view: {
                    label: 'Save state',
                    description: 'Preserve state'
                }
            }
        }
    });
    Y.Plugin.ToggleOnClick = ToggleOnClick;


    var ToggleOnScript = Y.Base.create("wegas-toggle-on-script", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        eval: function(e) {
            Y.later(0, this, function() {
                var script = this.get("condition");
                var toggled = Y.Wegas.Facade.Variable.script.localEval(script);
                var tSelector = this.get("targetSelector");
                if (tSelector) {
                    this.get("host").get("contentBox").all(this.get("targetSelector")).toggleClass(this.get("className"), toggled);
                } else {
                    this.get("host").get("contentBox").toggleClass(this.get("className"), toggled);
                }
            });
        },
        initializer: function() {
            this.eval();
            this.vdUpdateHandler = Y.Wegas.Facade.Instance.after('update', this.eval, this);
        },
        destructor: function() {
            this.vdUpdateHandler && this.vdUpdateHandler.detach();
        }
    }, {
        NS: 'ToggleOnScript',
        ATTRS: {
            className: {
                type: 'string',
                value: '',
                view: {
                    label: 'Class to toggle'
                }
            },
            targetSelector: {
                type: 'string',
                value: '',
                view: {
                    label: 'Apply to node',
                    description: 'CSS selector'
                }
            },
            condition: {
                type: ["null", "object"],
                properties: {
                    "@class": {type: "string", value: "Script"},
                    content: {
                        type: "string"
                    }
                },
                view: {
                    type: 'scriptcondition',
                    label: 'Condition'
                }
            }
        }
    });
    Y.Plugin.ToggleOnScript = ToggleOnScript;
});
