/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <francois-xavier.aeberhard@red-agent.com>
 */
@Stateless
@LocalBean
public class RequestManagerFacade {

    private static final Logger logger = LoggerFactory.getLogger(RequestManagerFacade.class);
    /**
     *
     */
    @Inject
    private RequestManager requestManager;

    /**
     * @return the variableInstanceManager
     */
    public RequestManager getRequestManager() {
        return requestManager;
    }
    public void setView(Class view) {
        this.requestManager.setView(view);
    }
}
