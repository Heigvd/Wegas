package com.wegas.core.ejb;

import com.wegas.core.Helper;
import fish.payara.micro.cdi.Inbound;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.naming.NamingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class HelperBean {

    public static final String CLEAR_CACHE_EVENT_NAME = "ClearEmCache";

    @Inject
    RequestManager requestManager;

    public void clearCache(@Observes @Inbound(eventName = CLEAR_CACHE_EVENT_NAME) String event) {
        this.wipeCache();
    }

    public void wipeCache() {
        requestManager.getEntityManager().getEntityManagerFactory().getCache().evictAll();
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
