/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
var task1 = Variable.findByName(self.getGameModel(), 'task 1'),
    task2 = Variable.findByName(self.getGameModel(), 'task2'),
    commercial1 = Variable.findByName(self.getGameModel(), 'commercial1').getInstance(self),
    commercial2 = Variable.findByName(self.getGameModel(), 'commercial2').getInstance(self),
    commercial3 = Variable.findByName(self.getGameModel(), 'commercial3').getInstance(self),
    informaticien1 = Variable.findByName(self.getGameModel(), 'informaticien1').getInstance(self),
    informaticien2 = Variable.findByName(self.getGameModel(), 'informaticien2').getInstance(self),
    informaticien3 = Variable.findByName(self.getGameModel(), 'informaticien3').getInstance(self),
    resourceController = lookupBean("ResourceController"),
    gameModelFacade = lookupBean("GameModelFacade");

function testsimplepmg() {
    gameModelFacade.reset(gameModel);                                           // Reset current game model

    task1.getInstance(self).setProperty('bac', '1000');
    task2.getInstance(self).setProperty('bac', '1500');

    resourceController.addTaskPlannification(task1.getInstance(self).id, 1);
    resourceController.addTaskPlannification(task2.getInstance(self).id, 2);
    resourceController.addTaskPlannification(task2.getInstance(self).id, 3);

    resourceController.addAssignment(informaticien1.id, task1);
    resourceController.addAssignment(informaticien2.id, task1);

    resourceController.addAssignment(informaticien1.id, task2);
    resourceController.addAssignment(commercial1.id, task2);

    resourceController.addReservation(informaticien1.id, 1);
    resourceController.addReservation(informaticien1.id, 2);
    resourceController.addReservation(informaticien1.id, 3);
    resourceController.addReservation(informaticien2.id, 1);
    resourceController.addReservation(commercial1.id, 2);
    resourceController.addReservation(commercial1.id, 3);

    nextPeriod();                                                               // Avant-projet -> Plannification
    nextPeriod();                                                               // Plannification -> Execution
}

/**
 * Debbug function to create automatically some occupations and assignements in
 *  some employees.
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
