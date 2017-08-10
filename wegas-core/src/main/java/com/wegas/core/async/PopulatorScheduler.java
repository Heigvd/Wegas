/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.async;

import com.hazelcast.core.ILock;
import com.wegas.core.Helper;
import fish.payara.micro.cdi.Inbound;
import fish.payara.micro.cdi.Outbound;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Future;
import java.util.logging.Level;
import javax.annotation.Resource;
import javax.ejb.LocalBean;
import javax.enterprise.concurrent.ManagedExecutorService;
import javax.enterprise.event.Event;
import javax.enterprise.event.Observes;
import javax.enterprise.inject.Instance;

import javax.inject.Inject;
import javax.inject.Named;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Named
@LocalBean
public class PopulatorScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PopulatorScheduler.class);

    private static final int MAX_CREATORS;

    protected static final String EVENT_NAME = "Wegas_Populator_Event";

    protected static enum PopulatingCommand {
        START_ONE,
        START_ALL,
        STOP_ALL,
        ABORT_ALL
    }

    static {
        MAX_CREATORS = Integer.parseInt(Helper.getWegasProperty("wegas.nb_populators", "1"));
    }

    @Inject
    @Outbound(eventName = EVENT_NAME, loopBack = true)
    Event<PopulatingCommand> events;

    @Resource
    private ManagedExecutorService managedExecutorService;

    @Inject
    private Instance<Populator> myCreators;

    @Inject
    private PopulatorFacade populatorFacade;

    private static final Map<Populator, Future<Integer>> creators = new HashMap<>();

    public void removePopulator(Populator currentCreator) {
        PopulatorScheduler.creators.remove(currentCreator);
    }

    public void scheduleCreation() {
        logger.info("Send START_ONE");
        events.fire(PopulatingCommand.START_ONE);
    }

    public void stopAll() {
        logger.info("Send STOP_ALL");
        events.fire(PopulatingCommand.STOP_ALL);
    }

    public void abortAll() {
        logger.info("Send ABORT_ALL");
        events.fire(PopulatingCommand.ABORT_ALL);
    }

    public void startAll() {
        logger.info("Send START_ALL");
        events.fire(PopulatingCommand.START_ALL);
    }

    public void onScheduleCreation(@Observes @Inbound(eventName = EVENT_NAME) PopulatingCommand command) {
        logger.info("Command: " + command);
        switch (command) {
            case START_ALL:
                this.startAllLocalPopulators();
                break;
            case STOP_ALL:
                this.stopLocalPopulating();
                break;
            case ABORT_ALL:
                this.cancelLocalPopulating();
                break;
            case START_ONE:
                this.internalScheduleCreation();
                break;
        }
    }

    protected Future<Integer> internalScheduleCreation() {

        Future<Integer> future;
        ILock lock = populatorFacade.getLock();
        lock.lock();
        try {
            //Helper.printWegasStackTrace(new Exception());

            // allowed to create more creators ?
            if (creators.size() < MAX_CREATORS) {
                Populator newCreator = myCreators.get();
                future = managedExecutorService.submit(newCreator);
                creators.put(newCreator, future);
            } else {
                logger.error("Maximum number of creators reached (" + MAX_CREATORS + ")");
                future = creators.values().iterator().next();
            }
        } finally {
            lock.unlock();
        }
        return future;
    }

    public void startAllLocalPopulators() {
        int nbToCreate = MAX_CREATORS - creators.size();
        while (nbToCreate > 0) {
            internalScheduleCreation();
            nbToCreate--;
        }
    }

    /**
     * let populators finish their current task before stopping them
     */
    protected void stopLocalPopulating() {
        logger.info("Stop all local populators");
        // inform getNextOwnert to quit rather than selecting some work 
        populatorFacade.setForceQuit(true);
        // Wait 
        for (Future<Integer> future : creators.values()) {
            try {
                logger.info("Wait");
                Integer get = future.get();
                logger.info(" * Got " + get);
            } catch (Exception ex) {
                java.util.logging.Logger.getLogger(PopulatorScheduler.class.getName()).log(Level.SEVERE, null, ex);
            }
        }

        logger.info("Stop successfully");
        // future schedules are to be processed !
        populatorFacade.setForceQuit(false);
    }

    /**
     * Interrupt all background processes NOW
     */
    public void cancelLocalPopulating() {
        for (Future<Integer> future : creators.values()) {
            //future.get();
            future.cancel(true);
        }
    }
}
