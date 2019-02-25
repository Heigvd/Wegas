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
YUI.add('wegas-layout-list', function(Y) {
    "use strict";

    var BOUNDINGBOX = 'boundingBox',
        CONTENTBOX = 'contentBox',
        List, FlexList;

    /**
     * @name Y.Wegas.List
     * @extends Y.Widget
     * @borrows Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent
     * @class class to serialize widgets
     * @constructor
     * @description class to serialize widgets
     */
    List = Y.Base.create("wegas-list", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        /** @lends Y.Wegas.List# */

        // *** Private fields *** //
        // -

        // ** Lifecycle Methods ** /w
        /**
         * @function
         * @private
         * @description set class of the contentbox (vertical or horizontal)
         * add class with "clear:both" style after the contentbox.
         */
        syncUI: function() {
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
        getEditorLabel: function() {
            return Y.Wegas.Helper.stripHtml(this.get("name"));
        }
    }, {
        /** @lends Y.Wegas.List */
        EDITORNAME: "Folder",
        CSS_PREFIX: "wegas-list",
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
            name: {
                value: "List",
                type: "string",
                view: {
                    label: "Name"
                }
            },
            direction: {
                value: 'vertical',
                type: "string",
                view: {
                    label: "Direction",
                    type: 'select',
                    choices: ['vertical', 'horizontal']
                }
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
    Y.Wegas.List = List;


    FlexList = Y.Base.create("wegas-flexlist", Y.Wegas.List, [], {
        syncUI: function() {
            var cb = this.get(CONTENTBOX);

            if (this.get('direction') === 'vertical') {
                cb.addClass(this.getClassName('vertical'));
                cb.removeClass(this.getClassName('horizontal'));
            } else {
                cb.addClass(this.getClassName('horizontal'));
                cb.removeClass(this.getClassName('vertical'));
            }

        }
    }, {
        EDITORNAME: "Flex layout",
        // Redefine visibility and default value of some inherited attributes:
        ATTRS: {
            name: {
                value: "Flex List",
                type: "string",
                view: {
                    label: "Layout name",
                    // Hide in case this is a page:
                    className: "wegas-advanced-feature"
                }
            },
            direction: {
                value: 'vertical',
                type: "string",
                view: {
                    label: "Direction",
                    type: 'select',
                    choices: ['vertical', 'horizontal'],
                    // Hide in case this is a page:
                    className: "wegas-advanced-feature"
                }
            }
        }
    });
    Y.Wegas.FlexList = FlexList;

});
