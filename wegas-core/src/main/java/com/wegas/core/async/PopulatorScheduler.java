/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.async;

import com.wegas.core.Helper;
import fish.payara.micro.cdi.Inbound;
import fish.payara.micro.cdi.Outbound;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Future;
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
    
    protected static final String EVENT_NAME = "Wegas_StartPopulator";
    
    static {
        MAX_CREATORS = Integer.parseInt(Helper.getWegasProperty("wegas.nb_populators", "1"));
    }
    
    @Inject
    @Outbound(eventName = EVENT_NAME, loopBack = true)
    Event<String> events;

    @Resource
    private ManagedExecutorService managedExecutorService;

    @Inject
    private Instance<Populator> myCreators;
    
    private static final List<Populator> creators = new ArrayList<>();
    
    public void removePopulator(Populator currentCreator) {
        PopulatorScheduler.creators.remove(currentCreator);
    }
    
    public void scheduleCreation() {
        logger.error("SEND EVENT");
        events.fire("START");
    }
    
    public void onScheduleCreation(@Observes @Inbound(eventName = EVENT_NAME) String event) {
        logger.error("EVENT RECEIVED: " + event);
        this.internalScheduleCreation();
    }
    
    protected Future<Integer> internalScheduleCreation() {
        Future<Integer> future = null;
        // allowed to create more creators ?
        if (creators.size() < MAX_CREATORS) {
            Populator newCreator = myCreators.get();
            creators.add(newCreator);
            future = managedExecutorService.submit(newCreator);
        } else {
            logger.error("Maximum number of creators reached (" + MAX_CREATORS + ")");
        }
        return future;
    }
    
}
