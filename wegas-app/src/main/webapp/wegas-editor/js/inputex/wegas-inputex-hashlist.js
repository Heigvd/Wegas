/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-hashlist", function(Y) {
    "uset strict";

    /**
     * @name Y.inputEx.Wegas.HashList
     * @extends Y.inputEx.ListField
     * @class
     * @constructor
     */
    var inputEx = Y.inputEx, HashList = function(options) {
        HashList.superclass.constructor.call(this, options);
    };
    Y.extend(HashList, inputEx.ListField, {
        /** @lends Y.inputEx.Wegas.HashList# */

        /**
         * @function
         * @private
         */
        setOptions: function(options) {
            HashList.superclass.setOptions.call(this, options);
            this.options.keyField = options.keyField || "id";
            this.options.valueField = options.valueField;
        },
        /**
         * Convert the array of 2d elements to an javascript object
         *
         * @function
         * @private
         */
        seq: 2000,
        getValue: function() {
            var i, v = HashList.superclass.getValue.call(this),
                ret = {}, id;

            for (i = 0; i < v.length; i++) {
                id = v[i][this.options.keyField];

                if (Y.Lang.isArray(v[i])) {
                    ret[v[i][0]] = v[i][1];

                } else if (!id) {
                    id = this.seq;
                    ret[id] = this.seq;
                    this.seq++;
                } else {
                    if (this.options.valueField) {
                        ret[id] = v[i][this.options.valueField];

                    } else {
                        ret[id] = v[i];
                    }
                }
            }
            return ret;
        },
        /**
         * Convert the object into a list of pairs
         *
         * @function
         * @private
         */
        setValue: function(v, sendUpdatedEvent) {
            var key, val = [];

            if (this.options.elementType.type === "combine") {
                for (key in v) {
                    if (v.hasOwnProperty(key)) {
                        val.push([key, v[key]]);
                    }
                }
            } else {
                for (key in v) {
                    if (v.hasOwnProperty(key)) {
                        val.push(v[key]);
                    }
                }
            }
            HashList.superclass.setValue.call(this, val, sendUpdatedEvent);
        }
    });

    inputEx.registerType('hashlist', HashList);                                 // Register this class as "object" type
});
