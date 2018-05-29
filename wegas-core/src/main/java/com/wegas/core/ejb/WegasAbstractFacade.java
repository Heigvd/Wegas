/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import javax.inject.Inject;
import javax.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 */
public abstract class WegasAbstractFacade {

    private static final Logger logger = LoggerFactory.getLogger(WegasAbstractFacade.class);

    @Inject
    protected RequestManager requestManager;

    /**
     * get the entity manager
     *
     * @return the wegasPU entityManager
     */
    protected EntityManager getEntityManager() {
        return requestManager.getEntityManager();
    }

    /**
     * EntityManager Flush
     */
    public void flush() {
        getEntityManager().flush();
    }
}
