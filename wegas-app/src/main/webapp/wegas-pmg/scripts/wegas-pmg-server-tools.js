/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
// Functions for addArtosPredecessor
function addArtosPredecessor() {
    // ChoixEnvironnementDéveloppement predecessor
    addPredecessor('DossierSpécifications',
        ['ChoixEnvironnementDéveloppement', 'AnalyseExistant', 'AnalyseBesoins']);

    // ModélisationDonnées predecessor
    addPredecessor('ModélisationDonnées', ['DossierSpécifications', 'PrototypeUtilisateur']);

    // ModélisationTraitements predecessor
    addPredecessor('ModélisationTraitements', ['DossierSpécifications', 'PrototypeUtilisateur']);

    // ModélisationIHM predecessor
    addPredecessor('ModélisationIHM', ['DossierSpécifications', 'PrototypeUtilisateur']);

    // ProgrammationBD predecessor
    addPredecessor('ProgrammationBD', ['ModélisationDonnées']);

    // ProgrammationTraitements predecessor
    addPredecessor('ProgrammationTraitements', ['ModélisationDonnées', 'ModélisationTraitements']);

    // ProgrammationIHM predecessor
    addPredecessor('ProgrammationIHM', ['ModélisationIHM']);

    // PromotionSystème predecessor
    addPredecessor('PromotionSystème', ['DossierSpécifications']);

    // Tests predecessor
    addPredecessor('Tests',
        ['ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM', 'CorrectionModélisationTraitements', 'CorrectionProgrammationTraitements']);

    // ImplantationMachine predecessor
    addPredecessor('ImplantationMachine', ['ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM']);

    // PrototypeUtilisateur predecessor
    addPredecessor('PrototypeUtilisateur', ['ChoixEnvironnementDéveloppement', 'AnalyseExistant', 'AnalyseBesoins']);
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
