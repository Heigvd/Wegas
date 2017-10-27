/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

/**
 *
 * @author Maxence
 */
//@Specializes
//@Singleton
//public class MockPopulatorScheduler extends PopulatorScheduler {
//
    //private static final Logger logger = LoggerFactory.getLogger(MockPopulatorScheduler.class);
//
    ///**
     //* Just a hack to make the scheduleCreation process synchronous again
     //*/
    //@Override
    //public void scheduleCreation() {
        //Future<Integer> scheduleCreation = super.internalScheduleCreation();
        //try {
            //Integer get = scheduleCreation.get();
        //} catch (Exception ex) {
            //logger.error("EX: ", ex);
        //}
    //}
//
    ///**
     //* Do not start any populator at start
     //*/
    //public void startAllLocalPopulators() {
    //}
//}