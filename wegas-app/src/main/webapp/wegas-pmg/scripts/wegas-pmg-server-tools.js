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
    // ChoixEnvironnementD�veloppement predecessor
    listPredName.push('ChoixEnvironnementD�veloppement', 'AnalyseExistant', 'AnalyseBesoins');
    addPredecessor(Variable.findByName(gameModel, 'DossierSp�cifications').name, listPredName);

    // Mod�lisationDonn�es predecessor
    listPredName = [];
    listPredName.push('DossierSp�cifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gameModel, 'Mod�lisationDonn�es').name, listPredName);

    // Mod�lisationTraitements predecessor
    listPredName = [];
    listPredName.push('DossierSp�cifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gameModel, 'Mod�lisationTraitements').name, listPredName);

    // Mod�lisationIHM predecessor
    listPredName = [];
    listPredName.push('DossierSp�cifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gameModel, 'Mod�lisationIHM').name, listPredName);

    // ProgrammationBD predecessor
    listPredName = [];
    listPredName.push('Mod�lisationDonn�es');
    addPredecessor(Variable.findByName(gameModel, 'ProgrammationBD').name, listPredName);

    // ProgrammationTraitements predecessor
    listPredName = [];
    listPredName.push('Mod�lisationDonn�es', 'Mod�lisationTraitements');
    addPredecessor(Variable.findByName(gameModel, 'ProgrammationTraitements').name, listPredName);

    // ProgrammationIHM predecessor
    listPredName = [];
    listPredName.push('Mod�lisationIHM');
    addPredecessor(Variable.findByName(gameModel, 'ProgrammationIHM').name, listPredName);

    // PromotionSyst�me predecessor
    listPredName = [];
    listPredName.push('DossierSp�cifications');
    addPredecessor(Variable.findByName(gameModel, 'PromotionSyst�me').name, listPredName);

    // Tests predecessor
    listPredName = [];
    listPredName.push('ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM', 'CorrectionMod�lisationTraitements', 'CorrectionProgrammationTraitements');
    addPredecessor(Variable.findByName(gameModel, 'Tests').name, listPredName);

    // ImplantationMachine predecessor
    listPredName = [];
    listPredName.push('ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM');
    addPredecessor(Variable.findByName(gameModel, 'ImplantationMachine').name, listPredName);

    // PrototypeUtilisateur predecessor
    listPredName = [];
    listPredName.push('ChoixEnvironnementD�veloppement', 'AnalyseExistant', 'AnalyseBesoins');
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

    addOccupation("Andr�", 10);
    addOccupation("Andr�", 11);

    addOccupation("Pierre", 6);

    addOccupation("Yvonne", 6);

    addOccupation("Quentin", 9);

    addOccupation("Karim", 3);
}

function addOccupation(name, periode) {
    Variable.findByName(gameModel, name).addOccupation(self, periode, false, "");
}
