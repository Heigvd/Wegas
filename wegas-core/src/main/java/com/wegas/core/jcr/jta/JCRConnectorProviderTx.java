/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.jta;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.jta.JCRConnectorProvider.RepositoryType;
import com.wegas.core.jcr.page.Pages;
import com.wegas.core.persistence.game.GameModel;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import javax.ejb.PostActivate;
import javax.ejb.PrePassivate;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.ejb.TransactionRequiredLocalException;
import javax.inject.Named;
import javax.jcr.RepositoryException;
import javax.transaction.TransactionScoped;
import javax.transaction.TransactionSynchronizationRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Transaction scoped JCR Connector provider which bounds JCR repositories to the current
 * transaction
 *
 * @author maxence
 */
@Named("JCRConnectorProviderTX")
@TransactionScoped
public class JCRConnectorProviderTx implements Serializable {

    private static final long serialVersionUID = -1180630542160360589L;
    private static final Logger logger = LoggerFactory.getLogger(JCRConnectorProviderTx.class);

    /**
     * Resource to bound a JCRSync to the current transaction
     */
    @Resource
    private transient TransactionSynchronizationRegistry jtaSyncRegistry;

    /**
     * The JCR synchroniser for the current transaction
     */
    private transient JCRSync jtaSynchronizer;

    /**
     * local store for all connectors opened during the transaction
     */
    private transient final Map<String, JTARepositoryConnector> connectors = new HashMap<>();

    /**
     * Yups... passivate means serialize. How to serialize JCR changes ?? IDK...
     */
    @PrePassivate
    public void prePassivate() {
        logger.error("PRE PASSIVATE");
        this.rollback();
        throw WegasErrorMessage.error("NOT PASSIVABLE (a shame!)");
    }

    /**
     * See @PrePassivate note...
     */
    @PostActivate
    public void postActivate() {
        logger.error("POST ACTIVATE");
        throw WegasErrorMessage.error("NOT PASSIVABLE (a shame!)");
    }

    /**
     * As soon as this bean is construct, make sure there is a JCRSync bound to the current
     * transaction
     */
    @PostConstruct
    public void construct() {
        logger.trace("NEW TRANSACTION BEANLIFE CYCLE");
        if (jtaSyncRegistry != null && jtaSynchronizer == null) {
            jtaSynchronizer = new JCRSync(this);
            jtaSyncRegistry.registerInterposedSynchronization(jtaSynchronizer);
        } else {
            logger.trace(" * NULL -> NO-CONTEXT");
        }
    }

    public JCRSync getJTASynchronizer() {
        return jtaSynchronizer;
    }

    /**
     * Get a new detached connector.
     *
     * @param gameModel the gameModel
     * @param type      repository type
     *
     * @return a detached connector or null
     *
     * @throws RepositoryException something when wrong (no store ?)
     */
    public static JTARepositoryConnector getDetachedConnector(GameModel gameModel, RepositoryType type) throws RepositoryException {

        JTARepositoryConnector repo;
        switch (type) {
            case PAGES:
                repo = new Pages(gameModel.getId());
                break;
            case FILES:
                repo = new ContentConnector(gameModel, ContentConnector.WorkspaceType.FILES);
                break;
            case HISTORY:
                repo = new ContentConnector(gameModel, ContentConnector.WorkspaceType.HISTORY);
                break;
            default:
                repo = null;
        }

        if (repo != null) {
            repo.setManaged(false);
        }

        return repo;
    }

    /**
     * Get a managed connector. Setting TransactionAttributeType to MANDATORY compels to have an
     * existing transaction to get a connector. If there is not transaction, an exception is thrown.
     *
     * @param gameModel the gameModel
     * @param type      repository type
     *
     * @return a managed connector
     *
     * @throws RepositoryException               seems the data store is not available...
     * @throws TransactionRequiredLocalException when there is no transaction context
     */
    @TransactionAttribute(TransactionAttributeType.MANDATORY)
    protected JTARepositoryConnector getConnector(GameModel gameModel, RepositoryType type)
        throws RepositoryException, TransactionRequiredLocalException {
        String key = type + "::" + gameModel.getId();

        if (!this.connectors.containsKey(key)) {
            logger.debug("new connector: {}", key);
            this.connectors.put(key, JCRConnectorProviderTx.getDetachedConnector(gameModel, type));
        }

        JTARepositoryConnector repo = this.connectors.get(key);

        repo.setManaged(true);
        return repo;
    }

    /**
     * make sure changes from all opened repositories are "committable" or throw something bad
     *
     * @throws RuntimeException if unable to prepare the commit
     */
    protected void prepare() {
        boolean rollback = false;
        for (JTARepositoryConnector connector : connectors.values()) {
            logger.debug(" *** {} PREPARE", connector);
            try {
                connector.prepare();
            } catch (RuntimeException ex) {
                rollback = true;
            }
        }
        if (rollback) {
            throw WegasErrorMessage.error("JCR REPOSITORY ERROR");
        }
    }

    /**
     * Cancel all changes in all opened repositories
     */
    protected void rollback() {
        for (JTARepositoryConnector connector : connectors.values()) {
            logger.debug(" *** {} ROLLBACK", connector);
            connector.rollback();
        }
        connectors.clear();
    }

    /**
     * Commit all changes in all opened repositories
     */
    protected void commit() {
        for (JTARepositoryConnector connector : connectors.values()) {
            logger.debug(" *** {} COMMIT", connector);
            connector.commit();
        }
        connectors.clear();
    }

    /**
     * destroy log line...
     */
    @PreDestroy
    public void destroy() {
        logger.trace("PREDESTROY TRANSACTIONAL BEAN");
    }
}
