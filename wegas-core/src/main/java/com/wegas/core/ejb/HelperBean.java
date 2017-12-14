/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import fish.payara.micro.cdi.Inbound;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.naming.NamingException;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class HelperBean {

    public static final String CLEAR_CACHE_EVENT_NAME = "ClearEmCache";

    @Inject
    private RequestManager requestManager;

    @Inject
    private ScriptFacade scriptFacade;



    public void clearCache(@Observes @Inbound(eventName = CLEAR_CACHE_EVENT_NAME) String event) {
        this.wipeCache();
    }

    public void wipeCache() {
        requestManager.getEntityManager().getEntityManagerFactory().getCache().evictAll();
        scriptFacade.clearCache();
    }

    /**
     * @return looked-up EJB
     */
    public static HelperBean lookup() {
        try {
            return Helper.lookupBy(HelperBean.class);
        } catch (NamingException ex) {
            return null;
        }
    }


}
