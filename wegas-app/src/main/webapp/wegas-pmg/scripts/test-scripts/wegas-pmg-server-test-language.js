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

var PMGTest = (function() {
    "use strict";
    var gameModelFacade, loaded = false,
        language;

    function loadGameModelFacade() {
        if (!gameModelFacade) {
            gameModelFacade = lookupBean("GameModelFacade");
        }
    }

    function loadVariables() {
        if (!loaded) {
            loaded = true;
            language = getVariableDescriptor('language').getInstance(self);
        }
    }


    function testLanguage() {
        loadVariables();
        testLanguage1();
        testLocaleCompletness();
    }


    function testLanguage1() {
        var missingArgs, missingKey, missingLocale, ok,
            exp_missingArgs, exp_missingKey, exp_missingLocale, exp_ok,
            key = "messages.endOfTaskSwitchToNew.content";

        debug("testLanguage1");
        language.setValue("en");

        ok = I18n.t(key, {step: "STEP", task: "T1", nextTask: "T2", employeeName: "John", job: "Job"});
        exp_ok = "Hello <br /><br />I hereby inform you that I finished working on task \"T1\" and started working on task \"T2\" since STEP. <br /> <br />Regards<br />John <br /> Job";
        assertEquals(exp_ok, ok, "TestLanguage(): OK Failed");

        missingArgs = I18n.t(key, {task: "Task #1", nextTask: "Task #2"});
        exp_missingArgs = "[I18N] MISSING MANDATORY ARGUMENT \"job\" FOR \"" + key + "\"";
        assertEquals(exp_missingArgs, missingArgs, "TestLanguage(): Missing Arg");

        missingKey = I18n.t("wacky-name");
        exp_missingKey = "[I18N] MISSING en translation for \"wacky-name\"";
        assertEquals(exp_missingKey, missingKey, "TestLanguage(): Missing KEY");

        language.setValue("ru");
        missingLocale = I18n.t(key, {task: "Task #1", nextTask: "Task #2", employeeName: "John"});
        exp_missingLocale = "[I18N] MISSING ru LOCALE";
        assertEquals(exp_missingLocale, missingLocale, "TestLanguage(): Missing KEY");
        language.setValue("fr");
    }

    function testLocaleCompletness() {
        var missingInEn = assertTranslationsExists(i18nTable.fr, i18nTable.en),
            missingInFr = assertTranslationsExists(i18nTable.en, i18nTable.fr),
            message = "";

        if (missingInEn.length > 0) {
            message += "Missing EN translations : " + missingInEn;
        }
        if (missingInFr.length > 0) {
            message += "Missing FR translations : " + missingInFr;
        }

        if (message) {
            throw new Error(message);
        }
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
                    debug(" not found");
                    // Key is missing in table2
                    missings.push(fullKey);
                }
            }
        }

        return missings;
    }

    return {
        testAll: function() {
            return testLanguage();
        },
        testLanguage1: function() {
            return testLanguage1();
        },
        testLocaleCompletness: function() {
            return testLocaleCompletness();
        }
    };
}());