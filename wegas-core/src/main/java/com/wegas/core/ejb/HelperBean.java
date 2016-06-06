package com.wegas.core.ejb;

import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class HelperBean {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    public void wipeCache() {
        em.getEntityManagerFactory().getCache().evictAll();
    }
}
