function testsimplepmg() {
    var task1 = Variable.findByName(self.getGameModel(), 'task 1'),
            task2 = Variable.findByName(self.getGameModel(), 'task2'),
            jean = Variable.findByName(self.getGameModel(), 'Jean').getInstance(self),
            yves = Variable.findByName(self.getGameModel(), 'Yves').getInstance(self),
            resourceController = lookupBean("ResourceController"),
            gameModelFacade = lookupBean("GameModelFacade");

    gameModelFacade.reset(gameModel);                                           // Reset current game model

    task1.getInstance(self).setProperty('bac', '750');
    task2.getInstance(self).setProperty('bac', '1500');

    resourceController.addTaskPlannification(task1.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task2.getInstance(self).id, 2);
    resourceController.addTaskPlannification(task2.getInstance(self).id, 3);

    resourceController.addAssignment(yves.id, task1);
    resourceController.addAssignment(yves.id, task2);
    resourceController.addAssignment(jean.id, task2);

    resourceController.addReservation(yves.id, 1);
    resourceController.addReservation(yves.id, 2);
    resourceController.addReservation(yves.id, 3);
    resourceController.addReservation(jean.id, 2);
    resourceController.addReservation(jean.id, 3);
        
    nextPeriod();                                                               // Avant-projet -> Plannification
    nextPeriod();                                                               // Plannification -> Execution
}


/**
 * Debbug function to create automatically some occupations and assignements in
 *  some employees.
 * @returns {String}
 */
function tempInit() {
    var occupation, employees = flattenList(Variable.findByName(gm, 'employees')),
            tasks = Variable.findByName(gm, 'tasks');

    occupation = employees[0].getInstance(self).addOccupation();
    occupation.setTime(1.0);
    occupation = employees[0].getInstance(self).addOccupation();
    occupation.setTime(2.0);
    occupation = employees[1].getInstance(self).addOccupation();
    occupation.setTime(1.0);
    occupation = employees[2].getInstance(self).addOccupation();
    occupation.setTime(2.0);
    occupation = employees[2].getInstance(self).addOccupation();
    occupation.setTime(3.0);
    occupation.setEditable(false);

    //tasks.items.get(0).getPredecessors().add(tasks.items.get(1));

    employees[1].getInstance(self).assign(tasks.items.get(0));
    employees[0].getInstance(self).assign(tasks.items.get(1));

    return 'is initialized';
}