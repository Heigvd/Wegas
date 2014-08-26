/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
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
    var missingArgs, missingKey, missingLocale, ok,
        exp_missingArgs, exp_missingKey, exp_missingLocale, exp_ok,
        key = "messages.endOfTaskSwitchToNew.content";

    debug(arguments.callee.name);

    ok = I18n_t(key, {task: "Task #1", nextTask: "Task #2", employeeName: "John", job: "Job"});
    exp_ok = "La tâche \"Task #1\" est terminée, je passe à la tâche Task #2 <br/> Salutations <br/>John<br/> Job";
    assertEquals(exp_ok, ok, "TestLanguage(): OK Failed");

    missingArgs = I18n_t(key, {task: "Task #1", nextTask: "Task #2"});
    exp_missingArgs = "[I18N] MISSING MANDATORY ARGUMENT \"job\" FOR \"" + key + "\"";
    assertEquals(exp_missingArgs, missingArgs, "TestLanguage(): Missing Arg");

    missingKey = I18n_t("wacky-name");
    exp_missingKey = "[I18N] MISSING fr translation for \"wacky-name\"";
    assertEquals(exp_missingKey, missingKey, "TestLanguage(): Missing KEY");


    language.setValue("ru");
    missingLocale = I18n_t(key, {task: "Task #1", nextTask: "Task #2", employeeName: "John"});
    exp_missingLocale = "[I18N] MISSING ru LOCALE";
    assertEquals(exp_missingLocale, missingLocale, "TestLanguage(): Missing KEY");
    language.setValue("fr");
}
