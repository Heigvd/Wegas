/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.async.PopulatorScheduler;
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

    public MockPopulatorScheduler(){
        super();
        this.broadcast = false;
        this.async = false;
    }

    /**
     * Do not start any populator at start
     */
    @Override
    public void startAllLocalPopulators() {
    }
}
