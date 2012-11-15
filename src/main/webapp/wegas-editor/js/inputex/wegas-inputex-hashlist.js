/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-hashlist", function (Y) {
    "uset strict";

    var inputEx = Y.inputEx;

    inputEx.HashList = function (options) {
        inputEx.HashList.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.HashList, inputEx.ListField, {

        /**
         * Convert the array of 2d elements to an javascript object
         */
        seq: 2000,
        getValue: function () {
            var i, v = inputEx.HashList.superclass.getValue.call(this),
            obj = {}, id;

            for(i = 0; i < v.length; i++) {
                id = v[i].id;
                if (!id) {
                    id = this.seq;
                    obj[id] = this.seq;
                    this.seq++;
                }
                obj[id] = v[i];
            }
            return obj;
        },

        /**
         * Convert the object into a list of pairs
         */
        setValue: function (v) {
            var key, val = [];

            for (key in v) {
                if (v.hasOwnProperty(key)) {
                    val.push(v[key]);
                }
            }
            inputEx.HashList.superclass.setValue.call(this, val);
        }
    });

    inputEx.registerType('hashlist', inputEx.HashList);                         // Register this class as "object" type
});
