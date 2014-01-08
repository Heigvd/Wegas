/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.ResetEvent;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.ContentConnectorFactory;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModel_;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
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
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @Inject
    private Event<ResetEvent> resetEvent;

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
    public void create(final GameModel entity) {
        super.create(entity);

        final User currentUser = userFacade.getCurrentUser();
        entity.setCreatedBy(!(currentUser.getMainAccount() instanceof GuestJpaAccount) ? currentUser : null); // @hack @fixme, guest are not stored in the db so link wont work

        this.em.flush();
        variableDescriptorFacade.reviveItems(entity);                           // Revive entities
        //this.reset(entity);                                                   // Reset the game model

        userFacade.getCurrentUser().getMainAccount().addPermission("GameModel:View,Edit,Delete,Duplicate,Instantiate:gm" + entity.getId());
        userFacade.getCurrentUser().getMainAccount().addPermission("GameModel:Duplicate:gm" + entity.getId());
        userFacade.getCurrentUser().getMainAccount().addPermission("GameModel:Instantiate:gm" + entity.getId());
    }

    public void addGame(final GameModel gameModel, final Game game) {
        gameModel.addGame(game);
        this.reset(gameModel);                                                     // Reset the game model
    }

    @Override
    public void remove(final Long id) {
        userFacade.deleteAccountPermissionByInstance("gm" + id);
        userFacade.deleteRolePermissionsByInstance("gm" + id);

        for (Game g : this.find(id).getGames()) {
            userFacade.deleteAccountPermissionByInstance("g" + g.getId());
            userFacade.deleteRolePermissionsByInstance("g" + g.getId());
        }
        super.remove(id);
    }

    @Override
    public GameModel duplicate(final Long entityId) throws IOException {

        final GameModel srcGameModel = this.find(entityId);                     // Retrieve the entity to duplicate
        final GameModel newGameModel = (GameModel) srcGameModel.duplicate();

        boolean added = false;
        int suffix = 1;
        String newName = null;
        while (!added) {
            newName = srcGameModel.getName() + "(" + suffix + ")";
            try {
                this.findByName(newName);
                suffix++;
            } catch (NoResultException ex) {
                added = true;
            }
        }

        newGameModel.setName(newName);
        this.create(newGameModel);                                              // store it db
        em.flush();

        try {                                                                   //Clone jcr FILES
            ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(newGameModel.getId());
            connector.cloneWorkspace(srcGameModel.getId());
            newGameModel.setPages(srcGameModel.getPages());
        } catch (RepositoryException ex) {
            System.err.println(ex);
        }

        return newGameModel;
    }

    @Override
    public void remove(final GameModel gameModel) {
        super.remove(gameModel);
        //Remove jcr repo.
        // @TODO : in fact, removes all files but not the workspace. 
        // @fx Why remove files? The may be referenced in other workspaces
        try {
            ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModel.getId());
            connector.deleteWorkspace();
        } catch (RepositoryException ex) {
            System.err.println(ex);
        }
    }

    @Override
    public List<GameModel> findAll() {
        final CriteriaBuilder criteriaBuilder = getEntityManager().getCriteriaBuilder();
        final CriteriaQuery query = criteriaBuilder.createQuery();
        Root e = query.from(entityClass);
        query.select(e).orderBy(criteriaBuilder.asc(e.get("name")));
        return getEntityManager().createQuery(query).getResultList();
    }

    public List<GameModel> findTemplates() {
        final CriteriaBuilder criteriaBuilder = getEntityManager().getCriteriaBuilder();
        final CriteriaQuery query = criteriaBuilder.createQuery();
        Root e = query.from(entityClass);
        query.select(e)
                .where(criteriaBuilder.isTrue(e.get("template")))
                .orderBy(criteriaBuilder.asc(e.get("name")));
        return getEntityManager().createQuery(query).getResultList();
    }

    /**
     *
     * @param name
     * @return
     * @throws NoResultException
     */
    public GameModel findByName(final String name) throws NoResultException {
        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery cq = cb.createQuery();
        final Root<GameModel> gameModel = cq.from(GameModel.class);
        cq.where(cb.equal(gameModel.get(GameModel_.name), name));
        final Query q = em.createQuery(cq);
        return (GameModel) q.getSingleResult();
    }

    /**
     *
     * @param gameModelId
     */
    public void reset(final Long gameModelId) {
        this.reset(this.find(gameModelId));
    }

    public void reset(final GameModel gameModel) {
        gameModel.propagateDefaultInstance(true);                               // Propagate default instances
        em.flush();
        em.refresh(gameModel);
        resetEvent.fire(new ResetEvent(gameModel));                             // Send an reset event (for the state machine and other)
    }
}
