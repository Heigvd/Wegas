/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jta;

import com.wegas.core.jcr.page.Pages;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import javax.inject.Named;
import javax.jcr.RepositoryException;
import javax.persistence.Transient;
import javax.transaction.TransactionScoped;
import javax.transaction.TransactionSynchronizationRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
@Named("TransactionBean")
@TransactionScoped
public class JCRConnectorProvider implements Serializable {

    private static final long serialVersionUID = -1180630542160360589L;
    private static final Logger logger = LoggerFactory.getLogger(JCRConnectorProvider.class);

    @Resource
    @Transient
    private TransactionSynchronizationRegistry jtaSyncRegistry;

    @Transient
    private JTASynchronizer jtaSynchronizer;

    private final Map<Long, Pages> pagesConnector = new HashMap<>();

    @PostConstruct
    public void construct() {
        logger.error("NEW TRANSACTION BEANLIFE CYCLE");
        if (jtaSyncRegistry != null && jtaSynchronizer == null) {
            jtaSynchronizer = new JTASynchronizer(this);
            jtaSyncRegistry.registerInterposedSynchronization(jtaSynchronizer);
        } else {
            logger.error(" * NULL -> NO-CONTEXT");
        }
    }

    public JTASynchronizer getJTASynchronizer() {
        return jtaSynchronizer;
    }

    public Pages getPagesRepositoryConnector(Long gameModelId) throws RepositoryException {
        if (!this.pagesConnector.containsKey(gameModelId)) {
            this.pagesConnector.put(gameModelId, new Pages(gameModelId));
        }
        return this.pagesConnector.get(gameModelId);
    }

    void rollback() throws RepositoryException {
        for (Pages pagesDAO : pagesConnector.values()) {
            pagesDAO.rollback();
        }
    }

    void commit() throws RepositoryException {
        logger.error("COMMIT");
        for (Pages pagesDAO : pagesConnector.values()) {
            logger.error(" *** PAGES COMMIT");
            pagesDAO.commit();
        }
    }

    @PreDestroy
    public void destroy() {
        logger.error("PREDESTROY TRANSACTIONAL BEAN");
    }
}
