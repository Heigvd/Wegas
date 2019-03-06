/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.jta;

import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.page.Pages;
import com.wegas.core.persistence.game.GameModel;
import java.io.Serializable;
import javax.ejb.Local;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.ejb.TransactionRequiredLocalException;
import javax.enterprise.context.ContextNotActiveException;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Convenient methods to obtains Pages and ContentConnector, managed or not.
 *
 * @author maxence
 */
@Stateless
@Local
public class JCRConnectorProvider implements Serializable {

    private static final Logger logger = LoggerFactory.getLogger(JCRConnectorProvider.class);

    private static final long serialVersionUID = 1813671957414821987L;

    /**
     * TransactionScoped provider
     */
    @Inject
    private JCRConnectorProviderTx txBean;

    /**
     * Get a connector to the gamemodel pages repository.
     * <p>
     * If a transaction is running in the caller context, the returned connector will be managed by JTA.
     * If there is no transaction, returned connecter MUST be closed by the caller. In this case Pages#getManaged returns false.,
     * <p>
     * Setting TransactionAttribute to SUPPORTS explicitly says this methods support both transactional and non-transactional contexts
     *
     * @param gameModel the gameModel
     *
     * @return Pages connector
     *
     * @throws RepositoryException something went wrong
     */
    @TransactionAttribute(TransactionAttributeType.SUPPORTS)
    public Pages getPages(GameModel gameModel) throws RepositoryException {
        return (Pages) this.getConnector(gameModel, RepositoryType.PAGES);
    }

    /**
     * Get a connector to the gamemodel content repository
     * <p>
     * If a transaction is running in the caller context, the returned connector will be managed by JTA.
     * If there is no transaction, returned connecter MUST be closed by the caller. In this case Pages#getManaged returns false.,
     * <p>
     * Setting TransactionAttribute to SUPPORTS explicitly says this methods support both transactional and non-transactional contexts
     *
     * @param gameModel the gameModel
     * @param wsType    FILES or HISTORY
     *
     * @return content connector
     *
     * @throws RepositoryException
     */
    @TransactionAttribute(TransactionAttributeType.SUPPORTS)
    public ContentConnector getContentConnector(GameModel gameModel, ContentConnector.WorkspaceType wsType) throws RepositoryException {
        return (ContentConnector) this.getConnector(gameModel, RepositoryType.valueOf(wsType.toString()));
    }

    /**
     * Get a connector. Returns a managed connector if a transaction is available, a non managed otherwise.
     *
     * @param gameModel the gameModel
     * @param type      which type of repository ? pages, files or history.
     *
     * @return a JTARepositoryConnector
     *
     * @throws RepositoryException oups...
     */
    private JTARepositoryConnector getConnector(GameModel gameModel, RepositoryType type) throws RepositoryException {
        try {
            JTARepositoryConnector connector = txBean.getConnector(gameModel, type);
            logger.info("JCRConnector: open JTA connector {}", connector);
            return connector;
        } catch (ContextNotActiveException | TransactionRequiredLocalException ex) {
            JTARepositoryConnector connector = JCRConnectorProviderTx.getDetachedConnector(gameModel, type);
            logger.info("JCRConnector: Open Detached connector (NO JTA SUPPORT) {}", connector);
            return connector;
        }
    }

    /**
     *
     */
    public enum RepositoryType {
        FILES,
        HISTORY,
        PAGES
    }
}
