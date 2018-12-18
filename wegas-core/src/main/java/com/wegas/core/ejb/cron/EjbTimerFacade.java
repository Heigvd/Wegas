/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.cron;

import com.wegas.admin.AdminFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.jcr.JackrabbitConnector;
import com.wegas.core.persistence.game.Game.Status;
import com.wegas.core.security.ejb.UserFacade;
import java.io.Serializable;
import javax.enterprise.context.ApplicationScoped;
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
@ApplicationScoped
public class EjbTimerFacade extends WegasAbstractFacade implements Serializable {

    private static final long serialVersionUID = 2011413104880647221L;

    private static final Logger logger = LoggerFactory.getLogger(EjbTimerFacade.class);

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
     */
    public void deleteGames() {
        logger.info("Scheduled games GC");
        requestManager.su();
        try {
            adminFacade.deleteGames();
        } finally {
            requestManager.releaseSu();
        }
    }

    /**
     * clean game model
     */
    public void removeGameModels() {
        requestManager.su();
        logger.info("Scheduled gamemodels GC");
        try {
            gameModelFacade.removeGameModels();
        } finally {
            requestManager.releaseSu();
        }
    }


    /*
     * @FIXME Should also remove players, created games and game models
     */
    /**
     * Remove old idle guests each days
     */
    public void removeIdleGuests() {
        logger.info("Scheduled idle guests GC");
        requestManager.su();
        try {
            userFacade.removeIdleGuests();
        } finally {
            requestManager.releaseSu();
        }
    }

    /**
     * JCR clean old revisions each hour
     * <p>
     * OAK 1.8 will schedule this deletion automatically !!!
     */
    public void jcrGC() {
        logger.info("Scheduled JCR GC");
        try {
            requestManager.su();
            jcrConnector.revisionGC();
        } finally {
            requestManager.releaseSu();
        }
    }

}
