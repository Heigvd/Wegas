/*
 * Wegas
 * http://www.albasim.ch/wegas/
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

    var BOUNDINGBOX = 'boundingBox',
            CONTENTBOX = 'contentBox',
            List;

    /**
     * @name Y.Wegas.ChoiceList
     * @extends Y.Wegas.List
     * @class class to serialize widgets
     * @constructor
     * @description class to serialize widgets
     */
    List = Y.Base.create("wegas-choicelist", Y.Wegas.List, [], {
        /** @lends Y.Wegas.SoloList# */
        bindUI: function() {

        },
        syncUI: function() {
            this.constructor.superclass.syncUI.apply(this);
            this.set("element", this.get("element"));
        }

    }, {
        EDITORNAME: "Choice List",
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
                setter: function(val) {
                    val = val % this.size();
                    this.each(function(item) {
                        item.get("boundingBox").addClass("hiddenChild");
                    });
                    this.item(val).get("boundingBox").removeClass("hiddenChild");
                    return val;
                }
            }
        }
    });
    Y.namespace('Wegas').ChoiceList = List;

});
