package com.wegas.core.ejb;

import fish.payara.micro.cdi.Inbound;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class HelperBean {

    public static final String CLEAR_CACHE_EVENT_NAME = "ClearEmCache";
    private static final Logger logger = LoggerFactory.getLogger(HelperBean.class);

    @Inject
    RequestManager requestManager;

    public void clearCache(@Observes @Inbound(eventName = CLEAR_CACHE_EVENT_NAME) String event) {
        this.wipeCache();
    }

    public void wipeCache() {
        logger.error("Clear EntityManager 2ndLevel cache");
        requestManager.getEntityManager().getEntityManagerFactory().getCache().evictAll();
    }
}
