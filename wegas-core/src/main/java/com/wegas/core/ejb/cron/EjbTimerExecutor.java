/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.cron;

import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.persistence.game.Game.Status;
import fish.payara.cluster.Clustered;
import fish.payara.cluster.DistributedLockType;
import java.io.Serializable;
import javax.ejb.*;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * One Clustered Singleton to schedule some garbage collections.
 * <p>
 * Defining EJBTimer Scheduled within a Payara clustered singleton ensure methods will execute only once in the cluster.
 *
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Clustered(lock = DistributedLockType.LOCK)
@Singleton
public class EjbTimerExecutor extends WegasAbstractFacade implements Serializable {

    private static final long serialVersionUID = 2011413104880647221L;
    private static final Logger logger = LoggerFactory.getLogger(EjbTimerExecutor.class);

    /**
     * Since this clustered singleton MUST be serialisable, one should not inject
     * an EJB as the EJB proxy is not serialisable. The solution is to inject another CDI
     * bean which injects others EJB itself.
     */
    @Inject
    private EjbTimerFacade ejbTimerFacade;

    /**
     * CRON to delete games once the bin have been emptied. Note that only games
     * which are marked as {@link Status#PROCESSED} will be destroyed.
     * {@link Status#TODO} and {@link Status#CHARGED} ones will not be destroyed
     * <p>
     * This task is scheduled each Sunday at 1:30 am
     */
    @Schedule(hour = "1", minute = "30", dayOfWeek = "Sun")
    public void deleteGames() {
        ejbTimerFacade.deleteGames();
    }

    /**
     * clean game model once a month
     */
    @Schedule(hour = "4", dayOfMonth = "Last Sat")
    public void removeGameModels() {
        ejbTimerFacade.removeGameModels();
    }


    /*
     * @FIXME Should also remove players, created games and game models
     */
    /**
     * Remove old idle guests each days
     */
    @Schedule(hour = "4", minute = "12")
    public void removeIdleGuests() {
        ejbTimerFacade.removeIdleGuests();
    }

    /**
     * JCR clean old revisions each hour
     * <p>
     * OAK 1.8 will schedule this deletion automatically !!!
     */
    @Schedule(hour = "*", minute = "0")
    public void jcrGC() {
        ejbTimerFacade.jcrGC();
    }
}
