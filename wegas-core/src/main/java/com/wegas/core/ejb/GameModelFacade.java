/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.event.internal.ResetEvent;
import com.wegas.core.event.internal.lifecycle.EntityCreated;
import com.wegas.core.event.internal.lifecycle.PreEntityRemoved;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.ContentConnectorFactory;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.FileController;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.User;
import org.apache.shiro.SecurityUtils;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.persistence.*;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class GameModelFacade extends BaseFacade<GameModel> {

    /**
     *
     */
    final static String HISTORYPATH = "History";

    /**
     * fire before GameModel is removed
     */
    @Inject
    private Event<PreEntityRemoved<GameModel>> preRemovedGameModelEvent;

    /**
     * fire after GameModel is created
     */
    @Inject
    private Event<EntityCreated<GameModel>> createdGameModelEvent;

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
    @EJB
    private FileController fileController;

    /**
     *
     */
    public GameModelFacade() {
        super(GameModel.class);
    }


    /**
     * @param entity
     */
    @Override
    public void create(final GameModel entity) {
        super.create(entity);

        final User currentUser = userFacade.getCurrentUser();
        entity.setCreatedBy(!(currentUser.getMainAccount() instanceof GuestJpaAccount) ? currentUser : null); // @hack @fixme, guest are not stored in the db so link wont work

        this.getEntityManager().flush();
        variableDescriptorFacade.reviveItems(entity);                           // Revive entities
        createdGameModelEvent.fire(new EntityCreated<>(entity));
        userFacade.getCurrentUser().getMainAccount().addPermission("GameModel:View,Edit,Delete,Duplicate,Instantiate:gm" + entity.getId());
        userFacade.getCurrentUser().getMainAccount().addPermission("GameModel:Duplicate:gm" + entity.getId());
        userFacade.getCurrentUser().getMainAccount().addPermission("GameModel:Instantiate:gm" + entity.getId());
    }

    /**
     * @param gm
     */
    public void createWithDebugGame(final GameModel gm) {
        this.create(gm);
        this.addGame(gm, new DebugGame());
    }

    /**
     * @param gameModel
     * @param game
     */
    public void addGame(final GameModel gameModel, final Game game) {
        gameModel.addGame(game);
        this.reset(gameModel);                                                  // Reset the game model
    }

    @Override
    public void remove(final Long id) {
        userFacade.deleteAccountPermissionByInstance("gm" + id);
        userFacade.deleteRolePermissionsByInstance("gm" + id);

        for (Game g : this.find(id).getGames()) {
            userFacade.deleteAccountPermissionByInstance("g" + g.getId());
            userFacade.deleteRolePermissionsByInstance("g" + g.getId());
        }
        preRemovedGameModelEvent.fire(new PreEntityRemoved<>(this.find(id)));
        super.remove(id);
        this.flush();
    }

    /**
     * Find a unique name for this new game (e.g. Oldname(1))
     *
     * @param oName
     * @return
     */
    public String findUniqueName(String oName) {
        int suffix = 2;
        String newName = oName;
        while (true) {
            try {
                this.findByName(newName);
            } catch (WegasNoResultException ex) {
                return newName;
            } catch (NonUniqueResultException ex) {
            }
            newName = oName + "(" + suffix + ")";
            suffix++;
        }
    }

    @Override
    public GameModel duplicate(final Long entityId) throws IOException {
        final GameModel srcGameModel = this.find(entityId);                     // Retrieve the entity to duplicate
        final GameModel newGameModel = (GameModel) srcGameModel.duplicate();    // Duplicate it

        newGameModel.setName(this.findUniqueName(srcGameModel.getName()));      // Find a unique name for this new game (e.g. Oldname(1))
        this.create(newGameModel);                                              // Create the new game model

        try {                                                                   // Clone files and pages
            ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(newGameModel.getId());
            connector.cloneWorkspace(srcGameModel.getId());
            newGameModel.setPages(srcGameModel.getPages());
        } catch (RepositoryException ex) {
            System.err.println(ex);
        }

        return newGameModel;
    }

    /**
     * @param gameModelId
     * @return
     * @throws IOException
     */
    public GameModel duplicateWithDebugGame(final Long gameModelId) throws IOException {
        GameModel gm = this.duplicate(gameModelId);
        this.addGame(gm, new DebugGame());
        userFacade.duplicatePermissionByInstance("gm" + gameModelId, "gm" + gm.getId());
        return gm;
    }

    @Override
    public void remove(final GameModel gameModel) {
        super.remove(gameModel);
        //Remove jcr repo.
        // @TODO : in fact, removes all files but not the workspace. 
        // @fx Why remove files? The may be referenced in other workspaces
        try (ContentConnector connector = ContentConnectorFactory.getContentConnectorFromGameModel(gameModel.getId())) {
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

    /**
     * @return
     */
    public List<GameModel> findTemplateGameModels() {
        final CriteriaBuilder criteriaBuilder = getEntityManager().getCriteriaBuilder();
        final CriteriaQuery query = criteriaBuilder.createQuery();
        Root e = query.from(entityClass);
        query.select(e)
                .where(criteriaBuilder.isTrue(e.get("template")))
                .orderBy(criteriaBuilder.asc(e.get("name")));
        return getEntityManager().createQuery(query).getResultList();
    }

    /**
     * @param name
     * @return
     * @throws NoResultException
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public GameModel findByName(final String name) throws NonUniqueResultException, WegasNoResultException {
        final TypedQuery<GameModel> query = getEntityManager().createNamedQuery("GameModel.findByName", GameModel.class);
        query.setParameter("name", name);
        try {
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * @param gameModelId
     */
    public void reset(final Long gameModelId) {
        this.reset(this.find(gameModelId));
    }

    /**
     * @param gameModel
     */
    public void reset(final GameModel gameModel) {
        getEntityManager().flush();                                                             // Need to flush so prepersit events will be thrown (for example Game will add default teams)
        gameModel.propagateGameModel();
        gameModel.propagateDefaultInstance(true);                               // Propagate default instances
        getEntityManager().flush();                                 // DA FU    ()
        resetEvent.fire(new ResetEvent(gameModel));                             // Send an reset event (for the state machine and other)
    }

    /**
     * @param gameModelId
     * @param name
     * @param serializedGameModel
     * @throws RepositoryException
     * @throws IOException
     */
    private void createVersion(Long gameModelId, String name, String serializedGameModel) throws RepositoryException, IOException {

        if (!fileController.directoryExists(gameModelId, "/" + HISTORYPATH)) {  // Create version folder if it does not exist
            fileController.createDirectory(gameModelId, HISTORYPATH, "/", null, null);
        }

        fileController.createFile(gameModelId, name + ".json", "/" + HISTORYPATH,
                "application/octet-stream", null, null,
                new ByteArrayInputStream(serializedGameModel.getBytes("UTF-8")));// Create a file containing the version
    }

    /**
     * @param gameModelId
     * @param name
     * @throws RepositoryException
     * @throws IOException
     */
    public void createVersion(Long gameModelId, String name) throws RepositoryException, IOException {
        this.createVersion(gameModelId, name, this.find(gameModelId).toJson(Views.Export.class));
    }

    /**
     * @throws IOException
     */
    //@Schedule(hour = "2")
    public void automaticVersionCreation() throws IOException, RepositoryException {
        for (GameModel model : this.findTemplateGameModels()) {

            String serialized = model.toJson(Views.Export.class);
            String hash = Integer.toHexString(serialized.hashCode());

            //System.out.println("for" + model + "*" + hash);
            if (!fileController.directoryExists(model.getId(), "/" + HISTORYPATH)) {// Create version folder if it does not exist
                fileController.createDirectory(model.getId(), HISTORYPATH, "/", null, null);
            }

            List<AbstractContentDescriptor> history = fileController.listDirectory(model.getId(), "/" + HISTORYPATH);
            boolean found = false;
            for (AbstractContentDescriptor item : history) {
                //System.out.println("checking" + item.getName() + "*" + hash);
                if (item.getName().contains(hash)) {
                    //System.out.println("fOUND");
                    found = true;
                    break;
                }
            }

            if (!found) {
                this.createVersion(model.getId(),
                        new SimpleDateFormat("yyyy.MM.dd HH.mm.ss").format(new Date()) + "-" + hash + ".json",
                        serialized);
            }

            //System.gc();
        }
    }

    /**
     * @param gameModelId
     * @param path
     * @return
     * @throws IOException
     */
    public GameModel createFromVersion(Long gameModelId, String path) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        InputStream file = fileController.getFile(gameModelId, path);           // Retrieve file from content repository

        ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance
        GameModel gm = mapper.readValue(file, GameModel.class);                 // and deserialize file

        gm.setName(this.findUniqueName(gm.getName()));               // Find a unique name for this new game

        this.createWithDebugGame(gm);
        return gm;
    }

    /**
     * This method just do nothing but is very useful for some (obscure) purpose
     * like adding breakpoints in a javascript
     *
     * @param msg
     */
    public final void nop(String msg) {
        // for JS breakpoints...
    }
}
