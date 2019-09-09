/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import fish.payara.micro.cdi.Inbound;
import fish.payara.micro.cdi.Outbound;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.persistence.Cache;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class JPACacheHelper {

    public static final String CLEAR_CACHE_EVENT_NAME = "ClearEmCache";

    @Inject
    @Outbound(eventName = JPACacheHelper.CLEAR_CACHE_EVENT_NAME, loopBack = true)
    Event<String> messages;

    @Inject
    private RequestManager requestManager;

    @Inject
    private ScriptFacade scriptFacade;

    public void requestClearCache() {
        messages.fire("clear");
    }

    public void clearCache(@Observes @Inbound(eventName = CLEAR_CACHE_EVENT_NAME) String event) {
        this.clearCacheLocal();
    }

    public void clearCacheLocal() {
        this.getCache().evictAll();
        scriptFacade.clearCache();
    }

    private Cache getCache() {
        return requestManager.getEntityManager().getEntityManagerFactory().getCache();
    }
}
