/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-list', function (Y) {
    "use strict";

    var BOUNDINGBOX = 'boundingBox',
            CONTENTBOX = 'contentBox',
            List;

    /**
     * @name Y.Wegas.ItemSelector
     * @extends Y.Widget
     * @borrows Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class class to serialize widgets
     * @constructor
     * @description class to serialize widgets
     */
    List = Y.Base.create("wegas-list", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.List# */

        // *** Private fields *** //
        // -

        // ** Lifecycle Methods ** /
        /**
         * @function
         * @private
         * @description set class of the contentbox (vertical or horizontal)
         * add class with "clear:both" style after the contentbox.
         */
        syncUI: function () {
            var cb = this.get(CONTENTBOX);

            if (this.get('direction') === 'vertical') {
                cb.addClass(this.getClassName('vertical'));
                cb.removeClass(this.getClassName('horizontal'));
            } else {
                cb.addClass(this.getClassName('horizontal'));
                cb.removeClass(this.getClassName('vertical'));
            }
            this.get(BOUNDINGBOX).append('<div style="clear:both"></div>');
        },

        //Children serialization
        /**
         * @function
         * @private
         * @return object
         * @description Children serialization
         */
        toObject: function () {
            var i, object, children = [];
            object = Y.Wegas.Editable.prototype.toObject.apply(this, Array.prototype.slice.call(arguments));
            for (i = 0; i < this.size(); i = i + 1) {
                children.push(this.item(i).toObject());
            }
            object.children = children;
            return object;
        }
    }, {
        /** @lends Y.Wegas.List */

        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>defaultChildType: default value for children. Transient.</li>
         *    <li>children: list of widget. Transient.</li>
         *    <li>direction: string-helper to add class and set style of the
         *     list (vertical or horizontal). Vertical by default</li>
         * </ul>
         */
        ATTRS: {
            defaultChildType: {
                value: "Text",
                "transient": true
            },
            children: {
                "transient": true
            },
            direction: {
                value: 'vertical',
                type: "string",
                choices: [{
                        value: 'vertical'
                    }, {
                        value: 'horizontal'
                    }]
            }

            /**
             * Prevent widgetchild selection to be propagated through the hierarchy
             */
            //selected: {
            //    value: 2,
            //    readonly: true
            //}
        }
    });
    Y.namespace('Wegas').List = List;

});
