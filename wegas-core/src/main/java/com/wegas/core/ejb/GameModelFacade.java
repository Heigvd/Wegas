/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.ContentConnectorFactory;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModel_;
import com.wegas.core.security.ejb.UserFacade;
import java.io.IOException;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.jcr.RepositoryException;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class GameModelFacade extends AbstractFacadeImpl<GameModel> {

    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    @EJB
    private RequestFacade requestFacade;
    @EJB
    private UserFacade userFacade;

    /**
     *
     */
    public GameModelFacade() {
        super(GameModel.class);
    }

    /**
     *
     * @return
     */
    @Override
    public EntityManager getEntityManager() {
        return em;
    }

    @Override
    public void create(GameModel entity) {
        super.create(entity);
        if (entity.getId() != null) {
            userFacade.getCurrentUser().getMainAccount().addPermission("GameModel:Edit:gm" + entity.getId());
            userFacade.getCurrentUser().getMainAccount().addPermission("GameModel:View:gm" + entity.getId());
            if (entity.getGames().get(0) != null) {
                userFacade.getCurrentUser().getMainAccount().addPermission("Game:Edit:g" + entity.getGames().get(0).getId());
                userFacade.getCurrentUser().getMainAccount().addPermission("Game:View:g" + entity.getGames().get(0).getId());
            }
        }
    }

    @Override
    public void remove(final Long id) {
        userFacade.deleteUserPermissionByInstance("gm" + id);
        userFacade.deleteAllRolePermissionsById("gm" + id);

        for (Game g : this.find(id).getGames()) {
            userFacade.deleteUserPermissionByInstance("g" + g.getId());
            userFacade.deleteAllRolePermissionsById("g" + g.getId());
        }
        super.remove(id);
    }

    @Override
    public GameModel duplicate(final Long entityId) throws IOException {

        GameModel oldEntity = this.find(entityId);                              // Retrieve the entity to duplicate
        GameModel newEntity = (GameModel) oldEntity.duplicate();

        boolean added = false;
        int suffix = 1;
        String newName = null;
        while (!added) {
            newName = oldEntity.getName() + "(" + suffix + ")";
            try {
                this.findByName(newName);
                suffix++;
            } catch (NoResultException ex) {
                added = true;
            }
        }

        newEntity.setName(newName);
        this.create(newEntity);                                                 // store it db
        em.flush();

        try {                                                                   //Clone jcr FILES
            ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(newEntity.getId());
            connector.cloneWorkspace(oldEntity.getId());
        } catch (RepositoryException ex) {
            System.err.println(ex);
        }
        return newEntity;
    }

    @Override
    public void remove(GameModel gameModel) {
        super.remove(gameModel);
        //Remove jcr repo.
        //TODO : in fact, removes all files but not the workspace.
        try {
            ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModel.getId());
            connector.deleteWorkspace();
        } catch (RepositoryException ex) {
            System.err.println(ex);
        }
    }

    /**
     *
     * @param name
     * @return
     * @throws NoResultException
     */
    public GameModel findByName(String name) throws NoResultException {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<GameModel> gameModel = cq.from(GameModel.class);
        cq.where(cb.equal(gameModel.get(GameModel_.name), name));
        Query q = em.createQuery(cq);
        return (GameModel) q.getSingleResult();
    }

    /**
     *
     * @param gameModelId
     */
    public void reset(Long gameModelId) {
        GameModel gm = this.find(gameModelId);
        gm.propagateDefaultInstance(true);
        em.flush();
        em.refresh(gm);
        requestFacade.commit();
    }
}
