package com.wegas.core.ejb;

import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class HelperBean {

    @Inject
    RequestManager requestManager;

    public void wipeCache() {
        requestManager.getEntityManager().getEntityManagerFactory().getCache().evictAll();
    }
}
