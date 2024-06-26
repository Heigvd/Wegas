/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.GameController;
import jakarta.annotation.Resource;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionManagement;
import jakarta.ejb.TransactionManagementType;
import jakarta.inject.Inject;
import jakarta.transaction.NotSupportedException;
import jakarta.transaction.SystemException;
import jakarta.transaction.UserTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence
 */
@Stateless
@LocalBean
@TransactionManagement(TransactionManagementType.BEAN)
public class GameModelCheck {

    private static final Logger logger = LoggerFactory.getLogger(GameModelCheck.class);

    @Resource
    private UserTransaction utx;

    @Inject
    private RequestManager requestManager;

    @Inject
    private GameController gameController;

    @Inject
    private JPACacheHelper jpaCacheHelper;

    public Exception validate(GameModel gameModel) {
        return this.createGameAndRollback(gameModel);
    }

    private Exception createGameAndRollback(GameModel gameModel) {

        try {
            utx.begin();
            try {
                Game game = new Game();
                game.setName("aGame");
                gameController.create(gameModel.getId(), game);
            } catch (Exception ex) {
                logger.error("Fail to create a game based on {} ({})", gameModel, ex);
                return ex;
            } finally {
                //requestManager.setPlayer(null);
                utx.rollback();
                jpaCacheHelper.requestClearCache();
            }
        } catch (NotSupportedException | SystemException ex) {
            logger.error("Transaction failed", ex);
            throw WegasErrorMessage.error("Unexpected error " + ex);
        }

        return null;
    }
}
