/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */


var I18nTest, Y, YUI;

YUI = (function() {
    "use strict";
    return {
        add: function(name, callback) {
            callback.call(null, Y);
        }
    };
}());

Y = (function() {

    function add(lang, table) {
        var currentTable;
        currentTable = Y.Wegas.I18n._tables[lang] || {};
        Y.Wegas.I18n._tables[lang] = Y.merge(currentTable, table);
    }

    return {
        merge: function() {
            var e = 0, t = arguments.length, n = {}, r, i;
            for (; e < t; ++e) {
                i = arguments[e];
                for (r in i)
                    Object.prototype.hasOwnProperty.call(i, r) && (n[r] = i[r]);
            }
            return n;
        },
        Wegas: {
            I18n: {
                _tables: {},
                register: function(lang, table) {
                    add(lang, table);
                }
            }
        }
    };
}());



I18nTest = (function() {
    "use strict";

    function testLocaleCompletness() {
        var missingInEn = assertTranslationsExists(Y.Wegas.I18n._tables.fr, Y.Wegas.I18n._tables.en),
            missingInFr = assertTranslationsExists(Y.Wegas.I18n._tables.en, Y.Wegas.I18n._tables.fr),
            argsNotMatch = assertArgumentsMatch(Y.Wegas.I18n._tables.en, Y.Wegas.I18n._tables.fr),
            message = "";

        if (missingInEn.length > 0) {
            message += "Missing EN translations : " + missingInEn;
        }
        if (missingInFr.length > 0) {
            message += "Missing FR translations : " + missingInFr;
        }

        if (argsNotMatch.length > 0) {
            message += "Arguments mismatch : " + argsNotMatch;
        }

        if (message) {
            throw new Error(message);
        }
    }

    function assertArgumentsMatch(table1, table2, root) {
        var key, value, missings = [], queue = [],
            current, a1, a2, m1, m2, i;
        queue.push({
            t1: table1,
            t2: table2,
            root: root
        });
        while (current = queue.pop()) {
            for (key in current.t1) {
                var fullKey = (current.root ? current.root + "." + key : key);
                value = current.t1[key];
                if (typeof value !== "string") {
// Go deeper
                    queue.push({
                        t1: current.t1[key],
                        t2: current.t2[key],
                        root: fullKey
                    });
                } else {
                    // Only occurs when previous check has failed
                    if (current.t2[key]) {

                        a1 = value.match(/{{([a-zA-Z0-9_]*)}}/g) || [];
                        a2 = current.t2[key].match(/{{([a-zA-Z0-9_]*)}}/g) || [];
                        m1 = {};
                        m2 = {};
                        for (i = 0; i < a1.length; i += 1) {
                            m1[a1[i]] = false;
                        }
                        for (i = 0; i < a2.length; i += 1) {
                            m2[a2[i]] = false;
                        }
                        for (i in m1) {
                            if (m2[i] !== undefined) {
                                m1[i] = true;
                                m2[i] = true;
                            }
                        }
                        for (i in m1) {
                            if (!m1[i]) {
                                missings.push("ARGUMENT %" + i + "% NOT CONSISTENT FOR KEY " + fullKey);
                            }
                        }
                        for (i in m2) {
                            if (!m2[i]) {
                                missings.push("ARGUMENT %" + i + "% NOT CONSISTENT FOR KEY " + fullKey);
                            }
                        }
                    }
                }
            }
        }

        return missings;
    }

    function assertTranslationsExists(table1, table2, root) {
        var key, value, missings = [], queue = [],
            current;
        queue.push({
            t1: table1,
            t2: table2,
            root: root
        });
        while (current = queue.pop()) {
            for (key in current.t1) {
                var fullKey = (current.root ? current.root + "." + key : key);
                value = current.t2[key];
                if (value) {
                    if (typeof value !== "string") {
// Go deeper
                        queue.push({
                            t1: current.t1[key],
                            t2: current.t2[key],
                            root: fullKey
                        });
                    }
                } else {
                    // Key is missing in table2
                    missings.push(fullKey);
                }
            }
        }

        return missings;
    }

    return {
        testAll: function() {
            return testLocaleCompletness();
        }
    };
}());
