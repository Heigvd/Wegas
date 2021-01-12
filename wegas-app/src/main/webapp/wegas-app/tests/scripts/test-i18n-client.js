/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
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

    function add(module, locale, trTable, numberTable) {
        var langTable,
            effectiveTable,
            sp = locale.split(/[-_]/),
            lang = sp[0], variant = sp[1];

        langTable = Y.Wegas.I18n._tables[lang] = Y.Wegas.I18n._tables[lang] || {
            main: {
                tr: {},
                numbers: {}
            },
            variants: {}
        };

        if (variant) {
            effectiveTable = langTable.variants[variant] = langTable.variants[variant] || {
                tr: {},
                numbers: {}
            };
        } else {
            effectiveTable = langTable.main;
        }

        Y.mix(effectiveTable, {tr: trTable || {}, numbers: numberTable || {}});
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
        mix: function(receiver, supplier) {
            var exists, from, k, to;

            if (receiver && supplier) {
                from = supplier;
                to = receiver;

                for (k in from) {
                    if (from.hasOwnProperty(k)) {
                        exists = k in to;

                        if (exists && typeof to[k] === "object"
                            && typeof from[k] === "object") {
                            Y.mix(to[k], from[k]);
                        } else {
                            to[k] = from[k];
                        }
                    }
                }
            }
            return receiver;
        },

        config: {
            win: {}
        },
        Wegas: {
            I18n: {
                _tables: {},
                register: function(module, lang, trTable, numbersTable) {
                    add(module, lang, trTable, numbersTable);
                },
                update: function(module, lang, trTable, numbersTable) {
                    add(module, lang, trTable, numbersTable);
                }
            }
        }
    };
}());



I18nTest = (function() {
    "use strict";

    function log(msg) {
        if (console) {
            console.log(msg);
        } else if (print) {
            print(msg);
        }
    }

    function testLocaleCompletness() {
        var frTr = Y.Wegas.I18n._tables.fr.main.tr,
            enTr = Y.Wegas.I18n._tables.en.main.tr,
            missingInEn = assertTranslationsExists(frTr, enTr),
            missingInFr = assertTranslationsExists(enTr, frTr),
            argsNotMatch = assertArgumentsMatch(enTr, frTr),
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

        log("Assert arguments of matching translations in " + table1 + " and " + table2);
        if (!table1) {
            missings.push("REFERENCE TABLE IS NO DEFINED");
        }

        if (!table2) {
            missings.push("TABLE TO TEST IS NO DEFINED");
        }

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

        log("Assert all translations in " + table1 + " exist in " + table2);

        if (!table1) {
            missings.push("REFERENCE TABLE IS NO DEFINED");
        }

        if (!table2) {
            missings.push("TABLE TO TEST IS NO DEFINED");
        }


        queue.push({
            t1: table1,
            t2: table2,
            root: root
        });
        while (current = queue.pop()) {
            for (key in current.t1) {
                var fullKey = (current.root ? current.root + "." + key : key);
                value = current.t2[key];
                if (value !== undefined && value !== null) {
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
