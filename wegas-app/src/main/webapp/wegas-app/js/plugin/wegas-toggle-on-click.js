/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

YUI.add('wegas-toggle-on-click', function(Y) {
    "use strict";

    var ToggleOnClick = Y.Base.create("wegas-toggle-on-click", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        onClick: function(e) {
            var pSelector = this.get("parentSelector");
            var toggleOn = pSelector ? e.target.ancestor(pSelector) : e.target;
            toggleOn.toggleClass(this.get("className"));
        },
        initializer: function() {
            this.get("host").get("contentBox").delegate("click", this.onClick, this.get("targetSelector"), this);
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
                    label: 'Click on'
                }
            },
            parentSelector: {
                type: 'string',
                value: '',
                view: {
                    label: 'Toggle class on first parent of target'
                }
            },
        }
    });
    Y.Plugin.ToggleOnClick = ToggleOnClick;
});
