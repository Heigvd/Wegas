/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod cyril.junod at gmail.com
 */
YUI.add('wegas-choicelist', function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.ChoiceList
     * @extends Y.Wegas.List
     * @class class to serialize widgets
     * @constructor
     * @description class to serialize widgets
     */
    var List = Y.Base.create("wegas-choicelist", Y.Wegas.List,
            [Y.Wegas.Editable, Y.Wegas.Container], {
        /** @lends Y.Wegas.ChoiceList# */
        bindUI: function() {
            this.after("addChild", function() {
                this.set("element", this.get("element"));
            });
        },
        syncUI: function() {
            this.constructor.superclass.syncUI.apply(this);
            this.set("element", this.get("element"));
        },
        getActiveElement: function() {
            return this.item(this.get("element"));
        }

    }, {
        EDITORNAME: "Choice List",
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
            defaultChildType: {
                value: "Text",
                "transient": true
            },
            children: {
                "transient": true
            },
            direction: {
                value: 'vertical',
                readOnly: true,
                "transient": true
            },
            element: {
                value: 0,
                "transient": true,
                type: "number",
                validator: Y.Lang.isNumber,
                setter: function(val) {
                    if (this.size() > 0) {
                        val = val % this.size();
                        this.each(function(item) {
                            item.get("boundingBox").addClass("hiddenChild");
                        });
                        this.item(val).get("boundingBox").removeClass("hiddenChild");
                    }
                    return val;
                }
            }
        }
    });
    Y.namespace('Wegas').ChoiceList = List;

});
