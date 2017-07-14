/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.async.PopulatorScheduler;
import java.util.concurrent.Future;
import javax.inject.Singleton;
import javax.enterprise.inject.Specializes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence
 */
@Specializes
@Singleton
public class MockPopulatorScheduler extends PopulatorScheduler {

    private static final Logger logger = LoggerFactory.getLogger(MockPopulatorScheduler.class);

    /**
     * Just a hack to make the scheduleCreation process synchronous again
     */
    @Override
    public void scheduleCreation() {
        Future<Integer> scheduleCreation = super.internalScheduleCreation();
        try {
            Integer get = scheduleCreation.get();
        } catch (Exception ex) {
            logger.error("EX: ", ex);
        }
    }
}
