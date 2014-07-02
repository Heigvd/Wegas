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
    // ChoixEnvironnementD�veloppement predecessor
    addPredecessor('DossierSp�cifications',
        ['ChoixEnvironnementD�veloppement', 'AnalyseExistant', 'AnalyseBesoins']);

    // Mod�lisationDonn�es predecessor
    addPredecessor('Mod�lisationDonn�es', ['DossierSp�cifications', 'PrototypeUtilisateur']);

    // Mod�lisationTraitements predecessor
    addPredecessor('Mod�lisationTraitements', ['DossierSp�cifications', 'PrototypeUtilisateur']);

    // Mod�lisationIHM predecessor
    addPredecessor('Mod�lisationIHM', ['DossierSp�cifications', 'PrototypeUtilisateur']);

    // ProgrammationBD predecessor
    addPredecessor('ProgrammationBD', ['Mod�lisationDonn�es']);

    // ProgrammationTraitements predecessor
    addPredecessor('ProgrammationTraitements', ['Mod�lisationDonn�es', 'Mod�lisationTraitements']);

    // ProgrammationIHM predecessor
    addPredecessor('ProgrammationIHM', ['Mod�lisationIHM']);

    // PromotionSyst�me predecessor
    addPredecessor('PromotionSyst�me', ['DossierSp�cifications']);

    // Tests predecessor
    addPredecessor('Tests',
        ['ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM', 'CorrectionMod�lisationTraitements', 'CorrectionProgrammationTraitements']);

    // ImplantationMachine predecessor
    addPredecessor('ImplantationMachine', ['ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM']);

    // PrototypeUtilisateur predecessor
    addPredecessor('PrototypeUtilisateur', ['ChoixEnvironnementD�veloppement', 'AnalyseExistant', 'AnalyseBesoins']);
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
