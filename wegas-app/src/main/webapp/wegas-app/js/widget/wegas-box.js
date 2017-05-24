/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-box', function(Y) {
    'use strict';
    /**
     * @name Y.Wegas.Box
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class Displays a box widget
     * @constructor
     * @description  Display a simple box
     */
    var Box = Y.Base.create(
        'wegas-box',
        Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable],
        {
            /** @lends Y.Wegas.Box# */
            CONTENT_TEMPLATE: null,
            getEditorLabel: function() {
                return Y.Wegas.Helper.stripHtml(this.get('name'));
            }
        },
        {
            /** @lends Y.Wegas.Box */
            EDITORNAME: 'Box',
            ATTRS: {
                name: {
                    value: 'folder',
                    type: 'string',
                    view: { label: 'Name' }
                }
            }
        }
    );
    Y.Wegas.Box = Box;
});
