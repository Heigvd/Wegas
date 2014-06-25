// Functions for addArtosPredecessor
function addArtosPredecessor() {
    var listPredName = [];
    // ChoixEnvironnementD�veloppement predecessor
    listPredName.push('ChoixEnvironnementD�veloppement', 'AnalyseExistant', 'AnalyseBesoins');
    addPredecessor(Variable.findByName(gm, 'DossierSp�cifications').getName(), listPredName);

    // Mod�lisationDonn�es predecessor
    listPredName = [];
    listPredName.push('DossierSp�cifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gm, 'Mod�lisationDonn�es').getName(), listPredName);

    // Mod�lisationTraitements predecessor
    listPredName = [];
    listPredName.push('DossierSp�cifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gm, 'Mod�lisationTraitements').getName(), listPredName);

    // Mod�lisationIHM predecessor
    listPredName = [];
    listPredName.push('DossierSp�cifications', 'PrototypeUtilisateur');
    addPredecessor(Variable.findByName(gm, 'Mod�lisationIHM').getName(), listPredName);

    // ProgrammationBD predecessor
    listPredName = [];
    listPredName.push('Mod�lisationDonn�es');
    addPredecessor(Variable.findByName(gm, 'ProgrammationBD').getName(), listPredName);

    // ProgrammationTraitements predecessor
    listPredName = [];
    listPredName.push('Mod�lisationDonn�es', 'Mod�lisationTraitements');
    addPredecessor(Variable.findByName(gm, 'ProgrammationTraitements').getName(), listPredName);

    // ProgrammationIHM predecessor
    listPredName = [];
    listPredName.push('Mod�lisationIHM');
    addPredecessor(Variable.findByName(gm, 'ProgrammationIHM').getName(), listPredName);

    // PromotionSyst�me predecessor
    listPredName = [];
    listPredName.push('DossierSp�cifications');
    addPredecessor(Variable.findByName(gm, 'PromotionSyst�me').getName(), listPredName);

    // Tests predecessor
    listPredName = [];
    listPredName.push('ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM', 'CorrectionMod�lisationTraitements', 'CorrectionProgrammationTraitements');
    addPredecessor(Variable.findByName(gm, 'Tests').getName(), listPredName);

    // ImplantationMachine predecessor
    listPredName = [];
    listPredName.push('ProgrammationBD', 'ProgrammationTraitements', 'ProgrammationIHM');
    addPredecessor(Variable.findByName(gm, 'ImplantationMachine').getName(), listPredName);

    // PrototypeUtilisateur predecessor
    listPredName = [];
    listPredName.push('ChoixEnvironnementD�veloppement', 'AnalyseExistant', 'AnalyseBesoins');
    addPredecessor(Variable.findByName(gm, 'PrototypeUtilisateur').getName(), listPredName);
}

/**
 * Function to add taskPredecessor
 * @param {type} descName
 * @param {type} listPredName
 */
function addPredecessor(descName, listPredName) {
    var i, ii, iii, taskDescList = Variable.findByName(gm, 'tasks'),
        taskDesc;

    for (i = 0; i < taskDescList.items.size(); i++) {
        taskDesc = taskDescList.items.get(i);
        if (taskDesc.getName() == descName) {
            for (ii = 0; ii < listPredName.length; ii++) {
                for (iii = 0; iii < taskDescList.items.size(); iii++) {
                    if (listPredName[ii] == taskDescList.items.get(iii).getName()) {
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
    Variable.findByName(gm, name).addOccupation(self, periode, false, "");
}