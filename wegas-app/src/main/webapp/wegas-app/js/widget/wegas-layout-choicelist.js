/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod cyril.junod at gmail.com
 */
YUI.add('wegas-layout-choicelist', function (Y) {
    "use strict";

    /**
     * @name Y.Wegas.ChoiceList
     * @extends Y.Wegas.List
     * @class class to serialize widgets
     * @constructor
     * @description class to serialize widgets
     */
    var List = Y.Base.create("wegas-choicelist", Y.Wegas.List, [Y.Wegas.Editable, Y.Wegas.Parent], {
        /** @lends Y.Wegas.ChoiceList# */
        bindUI: function () {
            this.after("addChild", function () {
                this.set("element", this.get("element"));
            });
        },
        syncUI: function () {
            List.superclass.syncUI.apply(this);
            this.set("element", this.get("element"));
        },
        getActiveElement: function () {
            return this.item(this.get("element"));
        }

    }, {
            EDITORNAME: "Choice List",
            CSS_PREFIX: "wegas-choicelist",
            /**
             * @lends Y.Wegas.ChoiceList
             */
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
                element: {
                    value: 0,
                    "transient": true,
                    type: "number",
                    validator: Y.Lang.isNumber,
                    setter: function (val) {
                        if (this.size() > 0) {
                            val = val % this.size();
                            this.each(function (item) {
                                item.get("boundingBox").addClass("hiddenChild");
                            });
                            this.item(val).get("boundingBox").removeClass("hiddenChild");
                        }
                        return val;
                    }
                }
            }
        });
    Y.Wegas.ChoiceList = List;

});
