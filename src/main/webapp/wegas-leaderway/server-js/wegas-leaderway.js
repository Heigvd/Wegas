importPackage(javax.naming);

/**
 * terminate the current week.
 * if value of week < max value of week :
 * - Increment the value of week
 * - Check the end of all task (checkTasksEnd)
 * - Check the end of all absent (checkAbsencesEnd)
 * - Remove all deactivated assignments (removeDeactivatedAssignements)
 * - Active or Deactive some tasks (checkTasksState)
 * - Pay all active resources (payResources)
 * - Check the moral of all active resources (checkMoral)
 * - Check the 'LeadershipLevel' of all active resources (checkLeadershipLevel) 
 * if value of week = max value of week :
 * - to do
 */
function finishCurrentWeek(){
    var gm = self.getGameModel(),
    weekDescriptor = VariableDescriptorFacade.findByName(gm, 'week'),
    weekInstance = weekDescriptor.getInstance(self);
    if(weekInstance.getValue() < weekDescriptor.getMaxValue()){
        weekInstance.setValue(weekInstance.getValue()+1);
        this.checkTasksEnd();
        this.checkAbsencesEnd();
        this.removeDeactivatedAssignements();
        this.checkTasksState();
        this.payResources();
        this.checkMoral();
        this.checkLeadershipLevel();
        this.sendScore();
    }
}

/**
 * @return an Array of all active and not absent resourceDescriptor.
 */
function getValideResources(){
    var i, j, k, gm = self.getGameModel(), valideResources = new Array(), isValid = false,
    listResources = VariableDescriptorFacade.findByName(gm, 'resources'), resourceDescriptor, resourceInstance,
    listAbsences = VariableDescriptorFacade.findByName(gm, 'absences'), absencesInstance, assignment;
    for(i=0; i<listResources.items.size();i++){
        resourceDescriptor = listResources.items.get(i);
        resourceInstance = resourceDescriptor.getInstance(self);
        isValid = false;
        if(resourceInstance.getActive() == true){
            isValid = true;
            for(j=0; j<resourceInstance.getAssignments().size(); j++){
                assignment = resourceInstance.getAssignments().get(j);
                for(k=0; k<listAbsences.items.size();k++){
                    absencesInstance = listAbsences.items.get(k).getInstance(self);
                    if(assignment.getTaskDescriptorId() == absencesInstance.getDescriptorId() && absencesInstance.getActive() == true){
                        isValid = false;
                    }
                }   
            }
        }
        if(isValid) valideResources.push(resourceDescriptor);
    }
    return valideResources;
}

/**
 * @param ListDescriptor of ResourceDescriptor listResources, the list of all resources
 * @return An Array of all task assigned at one or many active and not absent resource.
 */
function getWorkedTasks(listResources){
    var i, j, k, gm = self.getGameModel(), workedTasks = new Array(), isWorked = false, assignment,
    resourceInstance, listTasks = VariableDescriptorFacade.findByName(gm, 'tasks'), taskDescriptor, taskInstance;
    for(i=0; i<listTasks.items.size();i++){
        taskDescriptor = listTasks.items.get(i)
        taskInstance = taskDescriptor.getInstance(self);
        isWorked = false;
        if(taskInstance.getActive() == true){
            for(j=0; j<listResources.length; j++){
                resourceInstance = listResources[j].getInstance(self);
                for(k=0; k<resourceInstance.getAssignments().size();k++){
                    assignment = resourceInstance.getAssignments().get(k);
                    if(assignment.getTaskDescriptorId() == taskInstance.getDescriptorId()){
                        isWorked = true;
                    }
                }   
            }
        }
        if(isWorked) workedTasks.push(taskDescriptor);
    }
    return workedTasks;
}

/**
 * Decreases the duration of all worked task by the number of workers on this task.
 * for each worked task that have a duration <=0, call the fonction 'doTaskEnd'
 * with the task and the corresponding workers for args.
 */
function checkTasksEnd(){
    var i, j, k, assignment, taskWorkers = new Array(),
    listValidResource = this.getValideResources(), resourceInstance,
    listWorkedTasks = this.getWorkedTasks(listValidResource), taskInstance;
    for(i=0; i<listWorkedTasks.length;i++){
        taskWorkers.length = 0;
        taskInstance = listWorkedTasks[i].getInstance(self);
        for(j=0; j<listValidResource.length; j++){
            resourceInstance = listValidResource[j].getInstance(self);
            for(k=0; k<resourceInstance.getAssignments().size(); k++){
                assignment = resourceInstance.getAssignments().get(k);
                if(assignment.getTaskDescriptorId() == taskInstance.getDescriptorId()){
                    taskWorkers.push(listValidResource[j]);
                }
            }
        }
         taskInstance.setDuration(taskInstance.getDuration()-taskWorkers.length);
         if(taskInstance.getDuration() <= 0){
            this.doTaskEnd(taskWorkers, listWorkedTasks[i]);
        }
    }
}

/**
 * Calculate experience (general gained and experience in skillsets needed by
 * the finished task) for all workers on a finished tasks.
 * can remove the 'wish' or the 'hate' values of these workers.
 * add the remuneration of the task at the general budget.
 * send a rapport-email to the player
 * Deactivate the task
 * @param Array of resourceDescriptor workersDescriptor, all the resources that worked on the task.
 * @param TaskDescriptor taskDescriptor, the task ended.
 */
function doTaskEnd(workersDescriptor, taskDescriptor){
    if(workersDescriptor.length <= 0 || taskDescriptor == null) return;
    var i,j, gm = self.getGameModel(), remuneration, taskInstance = taskDescriptor.getInstance(self),
    budgetInstance = VariableDescriptorFacade.findByName(gm, 'budget').getInstance(self), from = new Array(), content = new Array(),
    clientsSatisfaction = VariableDescriptorFacade.findByName(gm, 'clientsSatisfaction').getInstance(self), taskSkillKey,
    taskSkillValue, listTaskSkill = taskInstance.getSkillset(), taskDuration = taskInstance.getDescriptor().defaultVariableInstance.getDuration(), workerInstance,
    workQuality = 0, workPartsQuality = new Array(), workPartSkillsQuality = new Array(), sumWorkPartSkills = 0, averageWorkPartSkills = 0,
    sumWorkParts = 0, workerSkillsetValue, totalExperience = 0, skillExperience, moral, confidence, learningCoefficient, randomNumber,
    punderationMoral = 0.1,
    punderationConfidence = 0.2,
    punderationSkillsets = 0.7,
    punderationQualityWeight = 0.5

    for(i=0; i<workersDescriptor.length; i++){
        workPartSkillsQuality.length = 0;
        sumWorkPartSkills = 0;
        workerInstance = workersDescriptor[i].getInstance(self);
        moral = parseInt(workerInstance.getMoral());
        confidence = parseInt(workerInstance.getConfidence());
        learningCoefficient = parseInt(workerInstance.getProperty('learningCoefficient'));
        totalExperience = 0;
        for (j=0; j<listTaskSkill.size(); j++){
            taskSkillKey = listTaskSkill.keySet().toArray()[j];
            taskSkillValue = parseInt(listTaskSkill.get(taskSkillKey));
            workerSkillsetValue = parseInt(workerInstance.getSkillset().get(taskSkillKey));
            //calculate experience général (totalExperienceGained) part 1/2
            if(workerSkillsetValue<taskSkillValue){
                totalExperience += (taskSkillValue - workerSkillsetValue) * taskDuration / workersDescriptor.length;
            }
            //calculate experience in current skill
            if(workerSkillsetValue<taskSkillValue){
                skillExperience = Math.ceil((1-workerSkillsetValue/100)*10*learningCoefficient*taskDuration/workersDescriptor.length);
                workerInstance.setSkillset(taskSkillKey, parseInt(workerInstance.getSkillset(taskSkillKey)) + skillExperience);
            }
            //calculate work Quality part 1/4
            workPartSkillsQuality.push((workerSkillsetValue - taskSkillValue +100)/2);
        }
        //calculate experience général (totalExperienceGained) part 2/2
        workerInstance.setProperty('totalExperienceGained',  parseInt(workerInstance.getProperty('totalExperienceGained')) + totalExperience);
        //calculate work Quality part 2/4
        for(j=0; j<workPartSkillsQuality.length; j++){
            sumWorkPartSkills += workPartSkillsQuality[j];
        }
        averageWorkPartSkills = (sumWorkPartSkills/workPartSkillsQuality.length) * punderationSkillsets + moral * punderationMoral + confidence * punderationConfidence
        // check wish and hate
        for (j=0; j<listTaskSkill.size(); j++){
            taskSkillKey = listTaskSkill.keySet().toArray()[j];
            taskSkillValue = parseInt(listTaskSkill.get(taskSkillKey));
            workerSkillsetValue = parseInt(workerInstance.getSkillset().get(taskSkillKey));
            //calculate work Quality part 3/4
            if(taskSkillKey == workerInstance.getProperty('wish')){
                randomNumber = Math.floor(Math.random()*6)+5;
                averageWorkPartSkills += randomNumber;
                if(averageWorkPartSkills>100) averageWorkPartSkills = 100;
            }
            if(taskSkillKey == workerInstance.getProperty('hate')){
                randomNumber = Math.floor(Math.random()*6)+5;
                averageWorkPartSkills -= randomNumber;
                if(averageWorkPartSkills<0) averageWorkPartSkills = 0;
            }
            //check wish
            randomNumber = Math.random();
            if((averageWorkPartSkills <= 50 || randomNumber < 0.33) && taskSkillKey == workerInstance.getProperty('wish')){
                workerInstance.setProperty('wish', '');
            }
            //check hate
            randomNumber = Math.random();
            if((averageWorkPartSkills > 50 && randomNumber < 0.33) && taskSkillKey == workerInstance.getProperty('hate')){
                workerInstance.setProperty('hate', '');
            }
        }
        averageWorkPartSkills = Math.round(averageWorkPartSkills);
        workPartsQuality.push(averageWorkPartSkills);
        workerInstance.setProperty('lastWorkQuality', averageWorkPartSkills);
        //check 'workWithLeader'
        if(taskInstance.getProperty('workWithLeader') == 'true'){
            workerInstance.setProperty('numberOfWorkWithLeader', parseInt(workerInstance.getProperty('numberOfWorkWithLeader'))+1);
        }
    }
    //calculate work Quality part 4/4
    for(i=0; i<workPartsQuality.length; i++){
        sumWorkParts += (workPartsQuality[i]);
    }
    workQuality = (sumWorkParts/workPartSkillsQuality.length);
    clientsSatisfaction.setValue(clientsSatisfaction.getValue()+(workQuality-50)*punderationQualityWeight);
    if(clientsSatisfaction.getValue()>100) clientsSatisfaction.setValue(100);
    if(clientsSatisfaction.getValue()<0) clientsSatisfaction.getValue(0);
    //calculate remuneration
    remuneration = parseInt(taskInstance.getProperty('salary'));
    if(workQuality >= parseInt(taskInstance.getProperty('workQualityMinForBonus'))){
        remuneration+=parseInt(taskInstance.getProperty('bonus'));
    }
    budgetInstance.setValue(budgetInstance.getValue()+remuneration);
    //e-mail
    for(i=0; i=workersDescriptor.length; i++){
        from.push(workersDescriptor[i].getInstance(self).getProperties('surname'));
    }
    content = new Array();
    content.push("Boujour, <br />Le mandat '");
    content.push(taskDescriptor.getDescription());
    content.push("' Vient d'être terminé. Le client ");
    switch(true){
        case workQuality<20 :
            content.push("n'est absolument pas statisfait de notre travail. Aucune chance qu'il nous mandate à nouveau. ");           
            break;
        case workQuality<40 :
            content.push("n'est pas statisfait de notre travail. Il est vrai que certaine erreurs ont été commises. ");           
            break;
        case workQuality<60 :
            content.push("est moyennement satisfait. La qualité n'est pas terrible mais le projet satisfaisant dans l'ensemble. ");           
            break;
        case workQuality<80 :
            content.push("est content du travail réalisé. Il n'hésitera pas à nous recontacter pour de nouveaux mandats. ");           
            break;
        default :
            content.push("est ravi par le travail réalisé. La qualité est au-delà de ses espérences et sera fidèle à notre entreprise. ");           
            break;
    }
    content.push("<br />");
    if(workQuality >= parseInt(taskInstance.getProperty('workQualityMinForBonus'))){
        content.push("Il a tenu à nous remercier par un bonus de ");
        content.push(taskInstance.getProperties('bonus'));
        content.push(".-");
    }
    content.push("<br /> Bonne journée.");
    content.push(from.join(', '));
    this.sendMessage('Fin de mandat', content.join(""), workersDescriptor[0].getInstance(self).getProperties('surname'));
    //desactivate Task
    taskInstance.setActive(false);
}

/**
 * Decrease absence duration by switch the current absenceTask with a other absenceTask wich have a duration 1 time smaller.
 * If the duration must reach 0, remove this assignation, set the resource 'moral' to 40 and recalculate the teamMotivation's value.
 * If duration is smaller than 0, deactivate the task.
 */
function checkAbsencesEnd(){
    var i, j, k, l, gm = self.getGameModel(), assignment, duration,
    listAbsences = VariableDescriptorFacade.findByName(gm, 'absences'), absenceInstance,
    listResources = VariableDescriptorFacade.findByName(gm, 'resources'), resourceInstance,
    assignmentToRemove = new Array();
    for(i=0; i<listResources.items.size();i++){
        resourceInstance = listResources.items.get(i).getInstance(self);
        for(j=0; j<resourceInstance.getAssignments().size();j++){
        assignment = resourceInstance.getAssignments().get(j);
            for(k=0; k<listAbsences.items.size();k++){
                absenceInstance = listAbsences.items.get(k).getInstance(self);       
                if(assignment.getTaskDescriptorId() == absenceInstance.getDescriptorId() && absenceInstance.getActive == true){
                    duration = absenceInstance.getDuration();
                    if(duration <= 0){
                        absenceInstance.setActive(false);   
                    }
                    else if(duration == 1){
                        assignmentToRemove.push(j);
                    }
                    else{
                        for(l=0; l<listAbsences.items.size();l++){
                            if(listAbsences.items[l].getInstance(self).getDuration() == duration-1){
                                assignment[j].setTaskDescriptorId(listAbsences.items[l].getInstance(self).getDescriptorId);
                            }
                        }
                    }
                }
            }
        }
        for(j=assignmentToRemove.length; j>=0;j--){
            resourceInstance.resourceInstance.getAssignments().remove(assignmentToRemove[j]);
        }
        resourceInstance.setMoral(40);
        this.calculateTeamMotivation()
    }
}

/**
 * Check 'active' value in each tasks (from list 'tasks') 
 * Activate and deactivate tasks according with its variables and if a resource work on.
 */
function checkTasksState(){
    var i, j, k, gm = self.getGameModel(), listTasks = VariableDescriptorFacade.findByName(gm, 'tasks'), taskInstance,
    newWeek = VariableDescriptorFacade.findByName(gm, 'week').getInstance(self), inProgress = false,
    listResources = VariableDescriptorFacade.findByName(gm, 'resources'), resourceInstance, assignment,
    newclientsSatisfaction = VariableDescriptorFacade.findByName(gm, 'clientsSatisfaction').getInstance(self);
    for(i=0; i<listTasks.items.size();i++){
        inProgress = false;
        taskInstance = listTasks.items.get(i).getInstance(self);
        for(j=0; j<listResources.items.size();j++){
            resourceInstance = listResources.items.get(j).getInstance(self);
            if(resourceInstance.getActive() == true){
                for(k=0; k< resourceInstance.getAssignments().size();k++){
                    assignment = resourceInstance.getAssignments().get(k);
                    if(assignment.getTaskDescriptorId() == taskInstance.getDescriptorId() && taskInstance.getActive() == true){
                        inProgress = true;
                    }
                }
            }
        }
        if(inProgress ||
            (newWeek.getValue() >= taskInstance.getProperty('appearAtWeek') &&
             newWeek.getValue() < taskInstance.getProperty('disappearAtWeek') &&
             newclientsSatisfaction.getValue() >= taskInstance.getProperty('clientSatisfactionMinToAppear') &&
             newclientsSatisfaction.getValue() <= taskInstance.getProperty('clientSatisfactionMaxToAppear') &&
             taskInstance.getDuration() > 0
            )
            ){
              taskInstance.setActive(true);     
        }
        else{
            taskInstance.setActive(false);
        }
    }
}

/**
 * Decreases current budget value by the sum of all salary of actives resources 
 */
function payResources(){
    var i, gm = self.getGameModel(),
    listResources = VariableDescriptorFacade.findByName(gm, 'resources'),
    budgetDescriptor = VariableDescriptorFacade.findByName(gm, 'budget'),
    budgetInstance = budgetDescriptor.getInstance(self),
    resourceInstance,
    sumSalary = 0;
    for(i=0;i<listResources.items.size();i++){
        resourceInstance = listResources.items.get(i).getInstance(self);
        if(resourceInstance.getActive() == true){
            sumSalary+=parseInt(resourceInstance.getProperty('salary'));   
        }
    }
    budgetInstance.setValue(budgetInstance.getValue()-sumSalary);
}

/**
 * Remove all assignements of resources (from list of tasks and list of absence) which are not 'active'.
 */
function removeDeactivatedAssignements(){
    var i, j, k, assignments = new Array(), assignment, gm = self.getGameModel(), resourceInstance,
    listResources = VariableDescriptorFacade.findByName(gm, 'resources'),
    listTasksObjects = this.getTasksAndAbsences(), taskObjectInstance;
    for(i=0; i<listResources.items.size(); i++){
        assignments.length = 0;
        resourceInstance = listResources.items.get(i).getInstance(self);
        for(j=0; j<resourceInstance.getAssignments().size(); j++){
            assignment = resourceInstance.getAssignments().get(j);
            for(k=0; k<listTasksObjects.length; k++){
                taskObjectInstance = listTasksObjects[k].getInstance(self);
                if(assignment.getTaskDescriptorId() == taskObjectInstance.getDescriptorId() && taskObjectInstance.getActive() == false){
                    assignments.push(assignment);
                }
            }
        }
        for(j=0; j<assignments.length; j++){
            resourceInstance.getAssignments().remove(assignments[j]);
        }
    }
}

/**
 * @return a Array of all tasks comming from list of task and list of absences)
 */
function getTasksAndAbsences(){
    var i, taskObjects = new Array(), gm = self.getGameModel(),
    listTasks = VariableDescriptorFacade.findByName(gm, 'tasks'),
    listAbsences = VariableDescriptorFacade.findByName(gm, 'absences');
    for(i=0; i<listTasks.items.size(); i++){
        taskObjects.push(listTasks.items.get(i));
    }
    for(i=0; i<listAbsences.items.size(); i++){
        taskObjects.push(listAbsences.items.get(i));
    }
    return taskObjects;
}

/**
 * for each active and not absent resource, check its moral.
 * If the moral value is low enough, give it a absence.
 * Recalculate the teamMotivation.
 */
function checkMoral(){
    var i, j, k, moral, randomNumber, absent = false, resourceDescriptor, resourceInstance,
    gm = self.getGameModel(), listAbsences = VariableDescriptorFacade.findByName(gm, 'absences'),
    absenceInstance, listResources = VariableDescriptorFacade.findByName(gm, 'resources');
    for(i=0; i<listResources.items.size(); i++){
        resourceDescriptor = listResources.items.get(i);
        resourceInstance = resourceDescriptor.getInstance(self);
        for(j=0; j<listAbsences.items.size(); j++){
            absenceInstance = listAbsences.items.get(j).getInstance(self);
            if(absenceInstance.getActive() == true){
                for(k=0; k<resourceInstance.getAssignments().size(); k++){
                    if(resourceInstance.getAssignments().get(k).getTaskDescriptorId() == absenceInstance.getDescriptorId()){
                        absent = true;
                    }
                }
            }
        }
        if(!absent){
            moral = resourceInstance.getMoral();
            randomNumber = Math.random();
            switch(true){
                case moral<10 :
                    if(randomNumber<0.33){
                        this.sendMessage('Démission', 'Bonjour,<br /> J\'ai déposé ma lettre de démission dans votre bureau. Le travail me plaisait mais vos méthodes ne me conviennent pas du tout et je préfère partir avant que la situation ne dégénère.<br /> Avec mes sincères salutations.<br />'+resourceInstance.getProperties('surname'), resourceInstance.getProperties('surname'));
                        resourceInstance.active(false);
                    }
                    else{
                        this.sendMessage('Congé maladie', 'Bonjour,<br /> Je ne me sens actuellement pas bien du tout. Mon médecin m\'a conseillé de rester chez moi au moins pour les deux semaines à venir.<br /> Bonne semaine.<br />'+resourceInstance.getProperties('surname'), resourceInstance.getProperties('surname'));
                        sickenResource(resourceDescriptor,2);
                    }
                    break;
                case moral<20 :
                    if(randomNumber<0.66){
                        this.sendMessage('Congé maladie', 'Bonjour,<br /> Je ne me sens actuellement pas bien du tout. Mon médecin m\'a conseillé de rester chez moi au moins pour les deux semaines à venir.<br /> Bonne semaine.<br />'+resourceInstance.getProperties('surname'), resourceInstance.getProperties('surname'));
                        sickenResource(resourceDescriptor,2);
                    }
                    break;
                case moral<30 :
                    if(randomNumber<0.33){
                        this.sendMessage('Congé maladie', 'Bonjour,<br /> Je ne me sens actuellement pas bien très bien, je crois que je tmbe malade. Je préfère rester chez moi cette semaine mais reviendrai en forme la semaine prochaine.<br /> Bonne semaine.<br />'+resourceInstance.getProperties('surname'), resourceInstance.getProperties('surname'));
                        sickenResource(resourceDescriptor,1);
                    }
                    break;
            }
        }
    }
}

/**
 * Calculate the current team motivation
 * firste, do the average of all moral value of resources.
 * then make an average between this value and the worst moral value.
 * set the 'teamMotivation' value with this new value.
 */
 function calculateTeamMotivation(){
    var i, sumMotivation = 0, gm = self.getGameModel(), activeResources = 0, moral,
    listResources = VariableDescriptorFacade.findByName(gm, 'resources'), worstMoralValue = 100,
    teamMotivation = VariableDescriptorFacade.findByName(gm, 'teamMotivation').getInstance(self);
    listResources.items.get(0).getInstance(self).setActive(false);
    for(i=0; i<listResources.items.size(); i++){
        if(listResources.items.get(i).getInstance(self).getActive() == true){
            moral = parseInt(listResources.items.get(i).getInstance(self).getMoral())
            sumMotivation += moral;
            activeResources++;
            if(moral<worstMoralValue) worstMoralValue = moral;
        }
    }
    teamMotivation.value = Math.round(((Math.round(sumMotivation/activeResources)+worstMoralValue)/2));
}


/**
 * Set the 'LeadershipLevel' value for each active resource.
 */
function checkLeadershipLevel(){
    var i, gm = self.getGameModel(), resourceInstance, newLeadershipLevel, leadershipPoints,
    listResources = VariableDescriptorFacade.findByName(gm, 'resources'),
    weekMaxValue = parseInt(VariableDescriptorFacade.findByName(gm, 'week').getMaxValue()),
    pointsMinToLlvl2 = 10*(weekMaxValue-1) + 75,
    pointsMinToLlvl3 = 15*(weekMaxValue-1) + 85;
    for(i=0; i<listResources.items.size(); i++){
        resourceInstance = listResources.items.get(i).getInstance(self);
        if(resourceInstance.getActive() == true){
            leadershipPoints = parseInt(resourceInstance.getConfidence()) + parseInt(resourceInstance.getProperty('totalExperienceGained'));
            switch(true){
                case leadershipPoints>=pointsMinToLlvl2 && leadershipPoints<pointsMinToLlvl3 :
                    newLeadershipLevel = 2
                    break;
                case leadershipPoints >= pointsMinToLlvl3 :
                    newLeadershipLevel = 3;
                    break;
                default :
                    newLeadershipLevel = 1;
            }
            resourceInstance.setProperty('leadershipLevel', newLeadershipLevel);
        }
    }
}

/**
 * send an in-game message with the current score to the player.
 */
function sendScore(){
    var content = new Array();
    content.push("Bonjour, <br />");
    content.push("Comme chaque semaine, voici le résultat de notre analyse concernant les entreprises nationales les mieux dirigées.");
    content.push("<br />");
    content.push("<p onclick='alert(12)>test</p>");
    content.push(this.getScore());
    this.sendMessage("Classement d'entreprises", content.join(""), "Top entreprise")
}

/**
 * @ return the current player's score 
 */
function getScore(){
    var gm = self.getGameModel(), teamMotivation, budget, clientSatisfaction,
    punderationBudget = 0.2,
    punderationMotivation = 0.45, 
    punderationSatisfaction = 0.35;
    teamMotivation = parseInt(VariableDescriptorFacade.findByName(gm, 'teamMotivation'));
    budget = parseInt(VariableDescriptorFacade.findByName(gm, 'budget'));
    clientSatisfaction = parseInt(VariableDescriptorFacade.findByName(gm, 'clientsSatisfaction'));
    return (budget/25*punderationBudget + teamMotivation*20*punderationMotivation + clientSatisfaction*20*punderationSatisfaction);
}

/**
 * Assign a task 'sick' to resource wich have a duration egal to the given duration
 * @param Integer resourceDescriptorId, the resourceDescriptor to sicken
 * @param Integer duration the duration of the sickness.
 */
function sickenResource(resourceDescriptorId, duration){
    var i, resInstance, taskDescriptor, gm=self.getGameModel(),
    listResources = VariableDescriptorFacade.findByName(gm, 'resources'),
    listAbsences = VariableDescriptorFacade.findByName(gm, 'absences');
    for(i=0; i<listResources.items.size(); i++){
        if(resourceDescriptorId == listResources.items.get(i).id){
            resInstance = listResources.items.get(i).getInstance(self);
        }
    }
    for(i=0; i<listAbsences.items.size(); i++){
        if(listAbsences.items[i].getInstance().getDuration() == duration){
            taskDescriptor = listAbsences.items[i];
            break;
        }
    }
    if(resInstance != null){
        resInstance.assign(0, taskDescriptor);
    }
    else{
        println('unknow id of resourceDescriptor in function sickenResource');
    }
}

/**
 * assign the given task at the given resource
 * if the given resource have already a assigned task, this new assigneemnt won't be added.
 * @param Integer resourceDescriptorId, the id of resourceDescriptors to assign
 * @param Integer taskDescriptorId, the id of task to assign
 */
function assignTask(resourceDescriptorId, taskDescriptorId){
    var i, j, resInstance, taskDescriptor, gm=self.getGameModel(), isWorking = false, 
    listResources = VariableDescriptorFacade.findByName(gm, 'resources'),
    listTasks = VariableDescriptorFacade.findByName(gm, 'tasks');
    for(i=0; i<listResources.items.size(); i++){
        if(resourceDescriptorId == listResources.items.get(i).id){
            resInstance = listResources.items.get(i).getInstance(self);
        }
    }
    for(i=0; i<listTasks.items.size(); i++){
        if(taskDescriptorId == listTasks.items.get(i).id){
            taskDescriptor = listTasks.items.get(i);
        }
        if(resInstance != null){
            for(j=0; j<resInstance.getAssignments().size(); j++){
                if(resInstance.getAssignments().get(j).getTaskDescriptorId() == taskDescriptor.getId() && taskDescriptor.getActive() == true){
                    isWorking = true;
                }
            }
        }
    }
    if(taskDescriptor != null && resInstance != null && !isWorking){
        resInstance.assign(0, taskDescriptor);   
    }
}

/**
 * get the specified wegas bean.
 * @param String name, the name of the bean
 * @return the wanted bean or null
 */
function lookupBean(name){
    var ctx = new InitialContext();
    return ctx.lookup('java:module/'+name);
}

/**
 * Send a message to the current player.
 * @param String subject, the subject of the message.
 * @param String message, the content of the message.
 * @param String from, the sender of the message.
 */
function sendMessage(subject, content, from){
    var EF = lookupBean('InGameMailFacade');
    if(EF != null){
         EF.send(self, subject, content, from);   
    }
    else{
        println('Bean InGameMailFacade does not exist, unable to send in-game message: '+subject);
    }
}