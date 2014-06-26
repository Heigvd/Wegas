/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
// Functions for addArtosPredecessor
function addArtosPredecessor() {
    var listPredName = [];
    // ChoixEnvironnementDéveloppement predecessor
    listPredName.push('ChoixEnvironnementDéveloppement', 'AnalyseExistant', 'AnalyseBesoins');
    addPredecessor(Variable.findByName(gameModel, 'DossierSpécifications').name, listPredName);

    // ModélisationDonnées predecessor
    listPredName = [];
    listPredName.push('DossierSpécifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gameModel, 'ModélisationDonnées').name, listPredName);

    // ModélisationTraitements predecessor
    listPredName = [];
    listPredName.push('DossierSpécifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gameModel, 'ModélisationTraitements').name, listPredName);

    // ModélisationIHM predecessor
    listPredName = [];
    listPredName.push('DossierSpécifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gameModel, 'ModélisationIHM').name, listPredName);

    // ProgrammationBD predecessor
    listPredName = [];
    listPredName.push('ModélisationDonnées');
    addPredecessor(Variable.findByName(gameModel, 'ProgrammationBD').name, listPredName);

    // ProgrammationTraitements predecessor
    listPredName = [];
    listPredName.push('ModélisationDonnées', 'ModélisationTraitements');
    addPredecessor(Variable.findByName(gameModel, 'ProgrammationTraitements').name, listPredName);

    // ProgrammationIHM predecessor
    listPredName = [];
    listPredName.push('ModélisationIHM');
    addPredecessor(Variable.findByName(gameModel, 'ProgrammationIHM').name, listPredName);

    // PromotionSystème predecessor
    listPredName = [];
    listPredName.push('DossierSpécifications');
    addPredecessor(Variable.findByName(gameModel, 'PromotionSystème').name, listPredName);

    // Tests predecessor
    listPredName = [];
    listPredName.push('ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM', 'CorrectionModélisationTraitements', 'CorrectionProgrammationTraitements');
    addPredecessor(Variable.findByName(gameModel, 'Tests').name, listPredName);

    // ImplantationMachine predecessor
    listPredName = [];
    listPredName.push('ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM');
    addPredecessor(Variable.findByName(gameModel, 'ImplantationMachine').name, listPredName);

    // PrototypeUtilisateur predecessor
    listPredName = [];
    listPredName.push('ChoixEnvironnementDéveloppement', 'AnalyseExistant', 'AnalyseBesoins');
    addPredecessor(Variable.findByName(gameModel, 'PrototypeUtilisateur').name, listPredName);
}

/**
 * Function to add taskPredecessor
 * @param {type} descName
 * @param {type} listPredName
 */
function addPredecessor(descName, listPredName) {
    var i, ii, iii, taskDescList = Variable.findByName(gameModel, 'tasks'),
        taskDesc;

    for (i = 0; i < taskDescList.items.size(); i++) {
        taskDesc = taskDescList.items.get(i);
        if (taskDesc.name == descName) {
            for (ii = 0; ii < listPredName.length; ii++) {
                for (iii = 0; iii < taskDescList.items.size(); iii++) {
                    if (listPredName[ii] == taskDescList.items.get(iii).name) {
                        taskDesc.getPredecessors().add(taskDescList.items.get(iii));
                        break;
                    }
                }
            }
            break;
        }
    }
}

// Functions for addArtosOccupation
function addArtosOccupation() {
    addOccupation("Gaelle", 6);
    addOccupation("Gaelle", 7);

    addOccupation("Murielle", 4);
    addOccupation("Murielle", 5);

    addOccupation("Kurt", 4);

    addOccupation("Diane", 2);

    addOccupation("Luc", 11);
    addOccupation("Luc", 12);

    addOccupation("André", 10);
    addOccupation("André", 11);

    addOccupation("Pierre", 6);

    addOccupation("Yvonne", 6);

    addOccupation("Quentin", 9);

    addOccupation("Karim", 3);
}

function addOccupation(name, periode) {
    Variable.findByName(gameModel, name).addOccupation(self, periode, false, "");
}
