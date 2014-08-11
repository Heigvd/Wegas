/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 *                ,*************************************.
 *                |         PM-GAME TEST ARTOS          |
 *                '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
 *
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */

var gameModelFacade,
    loaded = false,
    quality, costs, delay,
    currentPhase,
    /*
     * TASKS
     */
    task01, task02, task03, task04, task05, task06, task07, task08, task09, task10,
    task11, task12, task13, task14_20, task15_60, task16_61,
    /*
     * EMPLOYEES
     */
    com_gaelle, com_irene, com_yves, com_rene, com_claude, com_luc,
    it_jean, it_kurt, it_andre,
    hard_fabien, hard_murielle, hard_bastien, hard_herve, hard_pierre, hard_zoe, soft_philippe,
    soft_tom, soft_diane, soft_noemie, soft_urs, soft_xavier, soft_yvonne, soft_seb,
    monteur_quentin, monteur_wolf,
    web_karim, web_valerie, web_orianne;



function testArtos() {
    var oldMode = DEBUGMODE;
    DEBUGMODE = true;
    loadVariables();

    testGameVersion1();
    DEBUGMODE = oldMode;
}


function loadGameModelFacade() {
    if (!gameModelFacade) {
        debug("Load GameModelFacade");
        gameModelFacade = lookupBean("GameModelFacade");
    }
}

function reset() {
    debug("Reset...");
    loadGameModelFacade();
    //gameModelFacade.refresh(gameModel);
    //gameModelFacade.reset(gameModel);
}

function breakpoint(msg){
    loadGameModelFacade();
    gameModelFacade.nop(msg);
}

function loadVariables() {
    if (!loaded) {
        loaded = true;
        debug("Load Variables");

        quality = getVariableDescriptor('quality').getInstance(self);
        costs = getVariableDescriptor('costs').getInstance(self);
        delay = getVariableDescriptor('delay').getInstance(self);
        currentPhase = getVariableDescriptor('currentPhase').getInstance(self);

        /*
         * TASKS
         */
        task01 = getVariableDescriptor("ChoixEnvironnementDéveloppement");
        task02 = getVariableDescriptor("AnalyseExistant");
        task03 = getVariableDescriptor("AnalyseBesoins");
        task04 = getVariableDescriptor("DossierSpécifications");
        task05 = getVariableDescriptor("ModélisationDonnées");
        task06 = getVariableDescriptor("ModélisationTraitements");
        task07 = getVariableDescriptor("ModélisationIHM");
        task08 = getVariableDescriptor("ProgrammationBD");
        task09 = getVariableDescriptor("ProgrammationTraitements");
        task10 = getVariableDescriptor("ProgrammationIHM");
        task11 = getVariableDescriptor("PromotionSystème");
        task12 = getVariableDescriptor("Tests");
        task13 = getVariableDescriptor("ImplantationMachine");
        task14_20 = getVariableDescriptor("PrototypeUtilisateur");
        task15_60 = getVariableDescriptor("CorrectionModélisationTraitements");
        task16_61 = getVariableDescriptor("CorrectionProgrammationTraitements");
        /*
         * EMPLOYEES
         */
        com_gaelle = getVariableDescriptor("Gaelle");
        com_irene = getVariableDescriptor("Irène");
        com_yves = getVariableDescriptor("Yves");
        com_rene = getVariableDescriptor("René");
        com_claude = getVariableDescriptor("Claude");
        com_luc = getVariableDescriptor("Luc");
        it_jean = getVariableDescriptor("Jean");
        it_kurt = getVariableDescriptor("Kurt");
        it_andre = getVariableDescriptor("André");
        hard_fabien = getVariableDescriptor("Fabien");
        hard_murielle = getVariableDescriptor("Murielle");
        hard_bastien = getVariableDescriptor("Bastien");
        hard_herve = getVariableDescriptor("Hervé");
        hard_pierre = getVariableDescriptor("Pierre");
        hard_zoe = getVariableDescriptor("Zoé");
        soft_philippe = getVariableDescriptor("Philippe");
        soft_tom = getVariableDescriptor("Tom");
        soft_diane = getVariableDescriptor("Diane");
        soft_noemie = getVariableDescriptor("Noémie");
        soft_urs = getVariableDescriptor("Urs");
        soft_xavier = getVariableDescriptor("Xavier");
        soft_yvonne = getVariableDescriptor("Yvonne");
        soft_seb = getVariableDescriptor("Sébastien");
        monteur_quentin = getVariableDescriptor("Quentin");
        monteur_wolf = getVariableDescriptor("Wolf");
        web_karim = getVariableDescriptor("Karim");
        web_valerie = getVariableDescriptor("Valérie");
        web_orianne = getVariableDescriptor("Orianne");

        debug("Variables Loaded");
    }
}

function planGameManual(){
    debug("Plan");
    // Task 01 Gantt
    plan(task01, 1);
    plan(task02, 2, 3);

    // END GANTT

    // Gaelle
    assign(com_gaelle, task11);
    reserve(com_gaelle, 13, 14);

    // Irene
    assign(com_irene, task03, task11);
    reserve(com_irene, 3);

    // END RESOURCE
}

function testGameVersion1() {
    var start = Date.now(),
        a102b_a = getVariableDescriptor("a_Rencontrer"),
        a01 = getVariableDescriptor("variable_3");
    
    //breakpoint("pre reset");

    // DO NEVER CALL RESET 
    // reset();  DO NEVER CALL RESET                                            // NEVER CALL RESET()
    // DO NEVER CALL RESET 

    printDuration("reset", start);
    
    breakpoint("pre load");
    
    loadVariables();
    printDuration("load", start);

    breakpoint("pre plan");
    
    planGameManual();
    printDuration("plan", start);

    breakpoint("pre select 1");
    
    selectChoice(a01);
    
    breakpoint("pre select 2");
    
    // Choice1
    selectChoice(a102b_a);
    
    printDuration("END", start);
}
