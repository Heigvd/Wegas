/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.cron;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ILock;
import com.wegas.admin.AdminFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.jcr.JackrabbitConnector;
import com.wegas.core.persistence.game.Game.Status;
import com.wegas.core.security.ejb.UserFacade;
import javax.ejb.Schedule;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * A CDI singleton which acts as an interface to various EJBs.
 *
 * @see EjbTimerExecutor#ejbTimerFacade injection point.
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Singleton
@Startup
public class EjbTimerFacade extends WegasAbstractFacade {

    private static final long serialVersionUID = 2011413104880647221L;

    private static final Logger logger = LoggerFactory.getLogger(EjbTimerFacade.class);

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private AdminFacade adminFacade;

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private UserFacade userFacade;

    @Inject
    private JackrabbitConnector jcrConnector;

    /**
     * CRON to delete games once the bin have been emptied. Note that only games
     * which are marked as {@link Status#PROCESSED} will be destroyed.
     * {@link Status#TODO} and {@link Status#CHARGED} ones will not be destroyed
     * <p>
     * This task is scheduled each Sunday at 1:30 am
     */
    @Schedule(hour = "1", minute = "30", dayOfWeek = "Sun", persistent = false)
    public void deleteGames() {
        ILock lock = hzInstance.getLock("ScheduleGameGCLock");
        if (lock.tryLock()) {
            try {
                logger.info("Scheduled games GC");
                requestManager.su();
                try {
                    adminFacade.deleteGames();
                } finally {
                    requestManager.releaseSu();
                }
            } finally {
                lock.unlock();
            }
        }
    }

    /**
     * clean game model once a month
     */
    //@Schedule(hour = "4", dayOfMonth = "Last Sat", persistence = false)
    public void removeGameModels() {
        ILock lock = hzInstance.getLock("ScheduleGuestGCLock");
        if (lock.tryLock()) {
            try {
                requestManager.su();
                logger.info("Scheduled gamemodels GC");
                try {
                    gameModelFacade.removeGameModels();
                } finally {
                    requestManager.releaseSu();
                }
            } finally {
                lock.unlock();
            }
        }
    }

    /*
     * @FIXME Should also remove players, created games and game models
     */
    /**
     * Remove old idle guests each days
     */
    @Schedule(hour = "4", minute = "12", persistent = false)
    public void removeIdleGuests() {
        ILock lock = hzInstance.getLock("ScheduleGuestGCLock");
        if (lock.tryLock()) {
            try {
                logger.info("Scheduled idle guests GC");
                requestManager.su();
                try {
                    userFacade.removeIdleGuests();
                } finally {
                    requestManager.releaseSu();
                }
            } finally {
                lock.unlock();
            }
        }
    }

    /**
     * JCR clean old revisions each hour
     * <p>
     * OAK 1.8 will schedule this deletion automatically !!!
     */
    @Schedule(hour = "*", minute = "0", persistent = false)
    public void jcrGC() {
        ILock lock = hzInstance.getLock("ScheduleJCRGCLock");
        if (lock.tryLock()) {
            try {
                logger.info("Scheduled JCR GC");
                try {
                    requestManager.su();
                    jcrConnector.revisionGC();
                } finally {
                    requestManager.releaseSu();
                }
            } finally {
                lock.unlock();
            }
        }
    }

//    @Schedule(hour = "*", minute = "*", persistent = false)
//    public void logTest() throws InterruptedException {
//        ILock lock = hzInstance.getLock("ScheduleTestLock");
//        if (lock.tryLock()) {
//            try {
//                logger.error("HERE EJBTimer Run");
//                Thread.sleep(5000l);
//                logger.error("Done");
//            } finally {
//                lock.unlock();
//            }
//        }
//    }
}
