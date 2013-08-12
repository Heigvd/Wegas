importPackage(javax.naming);

var gm = self.getGameModel(),
        step = 1;


function goToNextPeriod() {
    //to do test of period
    this.completePeriod();
    //this.enter_next_period();
}

function completePeriod() {
    for (var i = 0; i < step; i++) {
        calculTasksProgress();
    }
}

function calculTasksProgress() {
    createActivity();
    calculateProgressOfNeeds();
}

function createActivity() {
    var i, listEmployees = flattenList(VariableDescriptorFacade.findByName(gm, "employees")),
            employeeDesc, employeeInst, assignments, choosedAssignment, activity;
    if (!listEmployees) {
        return false;
    }
    for (i = 0; i < listEmployees.length; i++) {
        employeeDesc = listEmployees[i];
        employeeInst = employeeDesc.getInstance(self);
        if (isReservedToWork(employeeInst)) {
            assignments = findAbstractAssignments(employeeInst, "assignments");
            if (isAssignable(assignments)) {
                choosedAssignment = chooseAssignement(employeeInst, assignments);
                if(choosedAssignment){
                    activity = employeeInst.createActivity(choosedAssignment.getTaskDescriptor());
                    activity.setTime(getCurrentInGameTime().period);
                } else{
                    println("try to create a activity by a null assignment in pmg-server-js, method createActivity()")
                }
            }
        }
    }
    return true;
}

function findAbstractAssignments(employeeI, cast) {
    var AbsAssignments;
    switch (cast) {
        case "assignments" :
            AbsAssignments = employeeI.getAssignments();
            break;
        case "occupations" :
            AbsAssignments = employeeI.getOccupations();
            break;
        case "activities" :
            AbsAssignments = employeeI.getActivities();
            break;
    }
    return AbsAssignments;
}

function isReservedToWork(employeeInst) {
    var i, occupations = findAbstractAssignments(employeeInst, "occupations"),
            time = getCurrentInGameTime(), reservedToWork = false;
    for (i = 0; i < occupations.size(); i++) {
        if (parseInt(occupations.get(i).getTime()) === time.period && isTrue(occupations.get(i).getEditable())) {
            reservedToWork = true;
        }
    }
    return reservedToWork;
}

function isAssignable(assignments) {
    var i, j, taskDesc, requierements, assignable = false, maybeAssignable = false,
            works, work, req, NbOfPersonnsByRequierements = 0;
    for (i = 0; i < assignments.size(); i++) {
        taskDesc = assignments.get(i).getTaskDescriptor();
        if (parseInt(taskDesc.getInstance(self).getProperties().get("completeness")) < 100) { //if the task isn't terminated
            requierements = taskDesc.getInstance(self).getRequirements();
            works = getRequierementsByWork(requierements); // get requierements merged by kind of work. 
            for (work in works) {
                if (works[work].completeness < works[work].maxLimit) { //check if the maximum limite from all requierements of the current kinf of work is smaller than the completeness of the current kind of work
                    maybeAssignable = true;
                }
                NbOfPersonnsByRequierements += works[work].totalOfEmployees;
            }
            if (maybeAssignable) {
                for (j = 0; j < requierements.size(); j++) {
                    req = requierements.get(j);
                    if (req.getCompleteness() < (works[req.getWork()].maxLimit * NbOfPersonnsByRequierements / works[req.getWork()].totalOfEmployees)) {
                        assignable = true;
                        break;
                    }
                }
                if (assignable) {
                    break;
                }
            }
        }
    }
    return assignable;
}

function getRequierementsByWork(requierements) {
    var i, req, works = {}, work, needsCompletion = 0, totalOfEmployees = 0;
    for (i = 0; i < requierements.size(); i++) {
        req = requierements.get(i);
        //keep an occurance of each kind of work needed
        if (works[req.getWork()]) {
            work = works[req.getWork()];
        } else {
            work = works[req.getWork()] = {
                maxLimit: 0,
                typesOfLevels: [],
                totalOfEmployees: 0,
                completeness: 0
            };
        }
        //keep the highest limit of all limits from each kind of work needed
        if (work.maxLimit < parseInt(req.getLimit())) {
            work.maxLimit = parseInt(req.getLimit());
        }
        //keep all kind of levels for each kind of work needed
        if (work.typesOfLevels.indexOf(req.getLevel()) <= -1) {
            work.typesOfLevels.push(req.getLevel());
        }
        //keep the summe of personns needed for each kind of work needed
        totalOfEmployees += parseInt(req.getQuantity());
        //is needed for next calcul
        needsCompletion += (parseInt(req.getCompleteness()) * parseInt(req.getQuantity()));
    }
    for (i in works) {
        //keep the summe of personns needed for each kind of work needed
        works[i].totalOfEmployees = totalOfEmployees;
        //keep the work completion for each kind of work needed
        works[i].completeness = (needsCompletion / totalOfEmployees);
    }
    return works;
}

function chooseAssignement(employeeInst, assignments) {
    var i, j, deltaLevel = 1000, work, level, reqs, choosedAssignement = null;
    work = employeeInst.getSkillsets().keySet().toArray()[0]
    level = employeeInst.getSkillsets().get(work);
    for (i = 0; i < assignments.size(); i++) { // search de minimum deltaLevel in a work corresponding to the employee skillset 
        reqs = assignments.get(i).getTaskDescriptor().getInstance(self).getRequirements();
        for (j = 0; j < reqs.size(); j++) {
            if (reqs.get(j).getWork() == work) { // === don't work
                choosedAssignement = assignments.get(i);
                break; //don't break if you use the following code (in comments)
//                if (Math.abs(deltaLevel) > level - req.getLevel()) {
//                    deltaLevel = level - reqs.get(j).getLevel();
//                    //can get ideal level hier
//                }
            }
        }
        if (choosedAssignement) {
            break;
        }
    }
    return choosedAssignement;
}

function calculateProgressOfNeeds(){
    
}

function tempInitializer() {
    var occupation, listEmployees = flattenList(VariableDescriptorFacade.findByName(gm, "employees"));
    occupation = listEmployees[0].getInstance(self).addOccupation();
    occupation.setTime(1.0);
    occupation = listEmployees[0].getInstance(self).addOccupation();
    occupation.setTime(2.0);

    occupation = listEmployees[1].getInstance(self).addOccupation();
    occupation.setTime(1.0);

    occupation = listEmployees[2].getInstance(self).addOccupation();
    occupation.setTime(2.0);

    listEmployees[0].getInstance(self).assign(VariableDescriptorFacade.findByName(gm, "tasks").items.get(0));
    return "is initialized";
}

function getCurrentInGameTime() {
    var inGameTime = {phase: null, period: null},
    phases = VariableDescriptorFacade.findByName(gm, "currentPeriod");
    inGameTime.phase = parseInt(currentPhase.value);
    if (phases !== null && inGameTime.phase !== null) {
        inGameTime.period = parseInt(phases.items.get(inGameTime.phase).getInstance(self).value);
    }
    return inGameTime;
}

function isTrue(arg) {
    return (arg == true || arg == "true") ? true : false; //=== don't work
}

function flattenList(list, finalList) {
    var i, el;
    finalList = (finalList) ? finalList : [];
    for (i = 0; i < list.items.size(); i++) {
        el = list.items.get(i);
        if (el.getClass() && el.getClass().toString() == "class com.wegas.core.persistence.variable.ListDescriptor") { //=== don't work
            finalList = this.flattenList(el, finalList);
        } else {
            finalList.push(el);
        }
    }
    return finalList;
}

/**
 * get the specified wegas bean.
 * @param String name, the name of the bean
 * @return the wanted bean or null
 */
function lookupBean(name) {
    var ctx = new InitialContext();
    return ctx.lookup('java:module/' + name);
}

/**
 * Send a message to the current player.
 * @param String subject, the subject of the message.
 * @param String message, the content of the message.
 * @param String from, the sender of the message.
 */
function sendMessage(subject, content, from) {
    var EF = lookupBean('MessageFacade');
    if (EF) {
        EF.send(self, subject, content, from);
    }
    else {
        println('Bean InGameMailFacade does not exist, unable to send in-game message: ' + subject);
    }
}

