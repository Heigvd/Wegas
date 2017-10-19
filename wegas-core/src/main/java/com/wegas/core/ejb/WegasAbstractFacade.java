/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import javax.inject.Inject;
import javax.interceptor.AroundInvoke;
import javax.interceptor.InvocationContext;
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

    //@AroundInvoke
    public Object interceptor(InvocationContext context) throws Exception {
        /*try {
            requestManager.getCurrentUser();
        } catch (WegasNotFoundException ex){
            logger.error("NO USER!");
        }*/
        logger.error("BEFORE PROCEEDED {}/{}", context.getTarget(), context.getMethod());
        Object proceed = context.proceed();
        logger.error("AFTER PROCEEDED {}/{}", context.getTarget(), context.getMethod());
        requestManager.processPostponed();
        return proceed;
    }

    /*
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
     */
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
