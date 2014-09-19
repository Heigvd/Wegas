/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * Contaims utiliy functions that are not linked to the PMG
 * 
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
importPackage(javax.naming);

var DEBUGMODE = false,
    Y = Y || {};

/**
 * get the specified wegas bean.
 * @param String name, the name of the bean
 * @return the wanted bean or null
 */
function lookupBean(name) {
    var ctx = new InitialContext();
    return ctx.lookup('java:module/' + name);
}
/**
 * 
 */
Y.Array = {
    each: function(array, fn, thisObj) {
        if (array.toArray)
            array = array.toArray();                                            //convert list to array
        for (var i = 0, len = (array && array.length) || 0; i < len; ++i) {
            if (i in array) {
                fn.call(thisObj || Y, array[i], i, array);
            }
        }
        return Y;
    },
    unique: function(array, testFn) {
        var i = 0,
            len = array.length,
            results = [],
            j, result, resultLen, value;

        // Note the label here. It's used to jump out of the inner loop when a value
        // is not unique.
        outerLoop: for (; i < len; i++) {
            value = array[i];

            // For each value in the input array, iterate through the result array
            // and check for uniqueness against each result value.
            for (j = 0, resultLen = results.length; j < resultLen; j++) {
                result = results[j];

                // If the test function returns true or there's no test function and
                // the value equals the current result item, stop iterating over the
                // results and continue to the next value in the input array.
                if (testFn) {
                    if (testFn.call(array, value, result, i, array)) {
                        continue outerLoop;
                    }
                } else if (value === result) {
                    continue outerLoop;
                }
            }

            // If we get this far, that means the current value is not already in
            // the result array, so add it.
            results.push(value);
        }
        return results;
    },
    find: function(a, f, o) {
        if (a.toArray)
            a = a.toArray();                                                    //convert list to array
        for (var i = 0, l = a.length; i < l; i++) {
            if (i in a && f.call(o, a[i], i, a)) {
                return a[i];
            }
        }
        return null;
    },
    sum: function(a, f, o) {
        if (a.toArray)
            a = a.toArray();                                                    //convert list to array
        for (var i = 0, l = a.length, r = 0; i < l; i++) {
            r += f.call(o, a[i], i, a);
        }
        return r;
    }
};
Y.Object = {
    keys: function(obj) {
        var keys = [], key;

        for (key in obj) {
            keys.push(key);
        }

        return keys;
    },
    values: function(obj) {
        var keys = Y.Object.keys(obj),
            i = 0,
            len = keys.length,
            values = [];
        for (; i < len; ++i) {
            values.push(obj[keys[i]]);
        }
        return values;
    }
};

Y.log = function(level, msg, sender) {
    println("[" + level + "] " + msg);
};

/**
 * Transform a wegas List in an array.
 * If the wegas list contain other wegas list (and contain other wegas list, etc),
 *  put each other list at the same level in the returned one level (flat) Array.
 * @param {List} list
 * @param {List} finalList
 * @returns {Array} the given finalList, in an Array object
 */
function flattenList(list, finalList) {
    var i, el;
    finalList = finalList || [];
    for (i = 0; i < list.items.size(); i++) {
        el = list.items.get(i);
        if (el.getClass() && el.getClass().toString() == 'class com.wegas.core.persistence.variable.ListDescriptor') {
            finalList = this.flattenList(el, finalList);
        } else {
            finalList.push(el);
        }
    }
    return finalList;
}

/**
 * Print a console msg if in debug mode
 * 
 * @param {String} msg
 */
function debug(msg) {
    if (DEBUGMODE) {
        printMessage(msg);
    }
}

/**
 * Print a console msg if in debug mode
 * 
 * @param {String} msg
 */
function printMessage(msg) {
    println(msg);
    RequestManager.sendCustomEvent("debug", msg);
}