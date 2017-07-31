/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.event.internal.InstanceRevivedEvent;
import com.wegas.core.event.internal.lifecycle.EntityCreated;
import com.wegas.core.event.internal.lifecycle.PreEntityRemoved;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.page.Pages;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModel.Status;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.rest.FileController;
import com.wegas.core.rest.HistoryController;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.*;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.naming.NamingException;
import javax.persistence.NoResultException;
import javax.persistence.NonUniqueResultException;
import javax.persistence.TypedQuery;
import java.io.IOException;
import java.util.*;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.Team;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class GameModelFacade extends BaseFacade<GameModel> {

    private static final Logger logger = LoggerFactory.getLogger(GameModelFacade.class);

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

    @Inject
    private Event<InstanceRevivedEvent> instanceRevivedEvent;

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
    @EJB
    private FileController fileController;

    @EJB
    private HistoryController historyController;

    @EJB
    private PlayerFacade playerFacade;

    @Inject
    private TeamFacade teamFacade;

    @EJB
    private GameFacade gameFacade;

    @Inject
    private RequestManager requestManager;

    @Inject
    private StateMachineFacade stateMachineFacade;

    /**
     *
     */
    public GameModelFacade() {
        super(GameModel.class);
    }

    @Override
    public void create(final GameModel entity) {

        getEntityManager().persist(entity);

        final User currentUser = userFacade.getCurrentUser();
        entity.setCreatedBy(!(currentUser.getMainAccount() instanceof GuestJpaAccount) ? currentUser : null); // @hack @fixme, guest are not stored in the db so link wont work

        variableDescriptorFacade.reviveItems(entity, entity, true); // brand new GameModel -> revive all descriptor
        createdGameModelEvent.fire(new EntityCreated<>(entity));

        // 
        userFacade.addUserPermission(userFacade.getCurrentUser(), "GameModel:View,Edit,Delete,Duplicate,Instantiate:gm" + entity.getId());
    }

    /**
     * @param gameModel
     * @param context
     * @param create
     */
    public void propagateAndReviveDefaultInstances(GameModel gameModel, InstanceOwner context, boolean create) {
        this.propagateDefaultInstances(gameModel, context, create);
        this.getEntityManager().flush();
        this.reviveInstances(gameModel, context);
    }

    /**
     * @param gameModel
     * @param context
     * @param create
     */
    public void createAndRevivePrivateInstance(GameModel gameModel, InstanceOwner context) {
        this.createInstances(gameModel, context);
        this.getEntityManager().flush();
        this.reviveInstances(gameModel, context);
    }

    public void createInstances(GameModel gameModel, InstanceOwner owner) {
        for (VariableDescriptor vd : gameModel.getVariableDescriptors()) {
            vd.createInstances(owner);
        }
    }

    public void propagateDefaultInstances(GameModel gameModel, InstanceOwner context, boolean create) {
        // Propagate default instances 
        for (VariableDescriptor vd : gameModel.getVariableDescriptors()) {
            vd.propagateDefaultInstance(context, create);
        }

    }

    public void revivePrivateInstances(GameModel gameModel, InstanceOwner target) {
        for (VariableInstance vi : target.getPrivateInstances()){
            instanceRevivedEvent.fire(new InstanceRevivedEvent(vi));
        }
    }

    public void reviveInstances(GameModel gameModel, InstanceOwner context) {
        //logger.error("REVIVE INSTANCES");
        //Helper.printWegasStackTrace(new Exception());

        // revive just propagated instances
        for (VariableInstance vi : context.getAllInstances()) {
            instanceRevivedEvent.fire(new InstanceRevivedEvent(vi));
        }
    }

    public void runStateMachines(InstanceOwner context) {
        // Send reset envent to run state machines
        stateMachineFacade.runStateMachines(context);
    }

    public void reviveScopeInstances(GameModel gameModel, AbstractScope aScope) {
        aScope.propagateDefaultInstance(null, true);
        this.getEntityManager().flush();
        // revive just propagated instances
        for (VariableInstance vi : (Collection<VariableInstance>) aScope.getVariableInstances().values()) {
            instanceRevivedEvent.fire(new InstanceRevivedEvent(vi));
        }
    }

    /**
     * Add a DebugGame (and debug team) within the given game model unless it
     * already exists
     *
     * @param gameModel
     *
     * @return true if a new debugGame has been added, false if the gameModel
     *         already has one
     */
    public boolean addDebugGame(GameModel gameModel) {
        if (!gameModel.hasDebugGame()) {
            DebugGame debugGame = new DebugGame();
            this.addGame(gameModel, debugGame);

            gameFacade.addDebugTeam(debugGame);

            return true;
        }
        return false;
    }

    /**
     * @param gm
     */
    public void createWithDebugGame(final GameModel gm) {
        this.create(gm);
        this.addDebugGame(gm);
    }

    /**
     * @param toUpdate GameModel to update
     * @param source   GameModel to fetch instance from
     * @param player   instances owner
     *
     * @return the gameModel with default instance merged with player's ones
     */
    public GameModel setDefaultInstancesFromPlayer(GameModel toUpdate, GameModel source, Player player) {
        try {
            toUpdate.propagateGameModel(); // Be sure to fetch all descriptor through gm.getVDs();
            for (VariableDescriptor vd : toUpdate.getVariableDescriptors()) {
                vd = variableDescriptorFacade.find(vd.getId());

                VariableInstance srcVi = variableDescriptorFacade.find(source, vd.getName()).getInstance(player);

                this.getEntityManager().detach(srcVi);
                srcVi.setVersion(vd.getDefaultInstance().getVersion());

                VariableInstance dest = vd.getDefaultInstance();
                dest.merge(srcVi);
                instanceRevivedEvent.fire(new InstanceRevivedEvent(dest));
            }
            return toUpdate;
        } catch (WegasNoResultException ex) {
            throw WegasErrorMessage.error("GameModels does not match");
        }
    }

    /**
     * @param gameModelId
     * @param playerId
     *
     * @return the gameModel with default instance merged with player's ones
     */
    public GameModel setDefaultInstancesFromPlayer(Long gameModelId, Long playerId) {
        return setDefaultInstancesFromPlayer(this.find(gameModelId), this.find(gameModelId), playerFacade.find(playerId));
    }

    /**
     * @param gameModelId
     * @param playerId
     *
     * @return a new gameModel with default instance merged with player's ones
     */
    public GameModel createFromPlayer(Long gameModelId, Long playerId) {
        try {
            GameModel duplicata = this.duplicate(gameModelId);
            //this.getEntityManager().flush();

            GameModel source = this.find(gameModelId);
            Player player = playerFacade.findLive(playerId);
            setDefaultInstancesFromPlayer(duplicata, source, player);

            this.addDebugGame(duplicata);

            return duplicata;
        } catch (IOException ex) {
            throw WegasErrorMessage.error("GameModels does not match");
        }
    }

    /**
     * Only used by GameModelFacade.addDebugGame
     *
     * @param gameModel
     * @param game
     */
    public void addGame(final GameModel gameModel, final Game game) {
        gameModel.addGame(game);
        getEntityManager().persist(game);
        this.propagateAndReviveDefaultInstances(gameModel, game, true); // init debug game
    }

    @Asynchronous
    public void asyncRemove(final Long id) {
        this.remove(id);
    }

    /**
     * Find a unique name for this new game (e.g. Oldname(1))
     *
     * @param oName
     *
     * @return new unique name
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
        if (srcGameModel != null) {
            final GameModel newGameModel = (GameModel) srcGameModel.duplicate();

            newGameModel.setName(this.findUniqueName(srcGameModel.getName()));
            this.create(newGameModel);

            // Clone Pages
            // newGameModel.setPages(srcGameModel.getPages()); //already done by srcGameModel.duplicate(), no ?
            //Clone files & history (?)
            for (ContentConnector.WorkspaceType wt : ContentConnector.WorkspaceType.values()) {
                try (ContentConnector connector = new ContentConnector(newGameModel.getId(), wt)) {
                    connector.cloneRoot(srcGameModel.getId());
                } catch (RepositoryException ex) {
                    logger.error("Duplicating repository {} failure, {}", entityId, ex.getMessage());
                }
            }

            return newGameModel;
        } else {
            throw new WegasNotFoundException("GameModel not found");
        }
    }

    /**
     * @param gameModelId
     *
     * @return gameModel copy
     *
     * @throws IOException
     */
    public GameModel duplicateWithDebugGame(final Long gameModelId) throws IOException {
        GameModel gm = this.duplicate(gameModelId);
        this.addDebugGame(gm);
//        userFacade.duplicatePermissionByInstance("gm" + gameModelId, "gm" + gm.getId());
        return gm;
    }

    @Override
    public void remove(final GameModel gameModel) {
        final Long id = gameModel.getId();
        userFacade.deletePermissions(gameModel);

        for (Game g : this.find(id).getGames()) {
            userFacade.deletePermissions(g);
        }
        preRemovedGameModelEvent.fire(new PreEntityRemoved<>(this.find(id)));
        getEntityManager().remove(gameModel);
        // Remove pages.
        try (Pages pages = new Pages(id)) {
            pages.delete();
        } catch (RepositoryException e) {
            logger.error("Error suppressing pages for gameModel {}, {}", id, e.getMessage());
        }
        for (ContentConnector.WorkspaceType wt : ContentConnector.WorkspaceType.values()) {
            try (ContentConnector connector = new ContentConnector(gameModel.getId(), wt)) {
                connector.deleteRoot();
            } catch (RepositoryException ex) {
                logger.error("Error suppressing repository {}, {}", id, ex.getMessage());
            }
        }
    }

    /**
     * Set gameModel status, changing to {@link Status#LIVE}
     *
     * @param entity GameModel
     */
    public void live(GameModel entity) {
        entity.setStatus(Status.LIVE);
    }

    /**
     * Set gameModel status, changing to {@link Status#BIN}
     *
     * @param entity GameModel
     */
    public void bin(GameModel entity) {
        entity.setStatus(Status.BIN);
    }

    /**
     * Set gameModel status, changing to {@link Status#DELETE}
     *
     * @param entity GameModel
     */
    public void delete(GameModel entity) {
        entity.setStatus(Status.DELETE);
    }

    @Override
    public List<GameModel> findAll() {
        final TypedQuery<GameModel> query = getEntityManager().createNamedQuery("GameModel.findAll", GameModel.class);
        return query.getResultList();
    }

    /**
     * @param status
     *
     * @return all gameModel matching the given status
     */
    public List<GameModel> findByStatus(final GameModel.Status status) {
        final TypedQuery<GameModel> query = getEntityManager().createNamedQuery("GameModel.findByStatus", GameModel.class);
        query.setParameter("status", status);
        return query.getResultList();
    }

    /**
     * Template gameModels are editable scenrios
     *
     * @return all template GameModels public List<GameModel>
     * findTemplateGameModels() { final TypedQuery<GameModel> query =
     * getEntityManager().createNamedQuery("GameModel.findTemplate",
     * GameModel.class); return query.getResultList(); }
     */
    /**
     * @param name
     *
     * @return the gameModel with the given name
     *
     * @throws WegasNoResultException gameModel not exists
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
        // Need to flush so prepersit events will be thrown (for example Game will add default teams)
        ///getEntityManager().flush();
        //gameModel.propagateGameModel();  -> propagation is now done automatically after descriptor creation
        this.propagateAndReviveDefaultInstances(gameModel, gameModel, false); // reset the whole gameModel
        this.runStateMachines(gameModel);
    }

    public void reset(final Game game) {
        gameFacade.reset(game);
    }

    public void reset(final Team team) {
        teamFacade.reset(team);
    }

    public void reset(final Player player) {
        playerFacade.reset(player);
    }

    public void resetGame(final Player player) {
        gameFacade.reset(player.getGame());
    }

    public void resetTeam(final Player player) {
        teamFacade.reset(player.getTeam());
    }

    public Collection<GameModel> findByStatusAndUser(GameModel.Status status) {
        ArrayList<GameModel> gameModels = new ArrayList<>();
        Map<Long, List<String>> pMatrix = new HashMap<>();

        String roleQuery = "SELECT p FROM Permission p WHERE "
                + "(p.role.id in "
                + "    (SELECT r.id FROM User u JOIN u.roles r WHERE u.id = :userId)"
                + ")";

        String userQuery = "SELECT p FROM Permission p WHERE p.user.id = :userId ";

        this.processQuery(userQuery, pMatrix, null, status, null);
        this.processQuery(roleQuery, pMatrix, null, status, null);

        for (Map.Entry<Long, List<String>> entry : pMatrix.entrySet()) {
            Long id = entry.getKey();
            GameModel gm = this.find(id);
            if (gm != null && gm.getStatus() == status) {
                List<String> perm = entry.getValue();
                this.detach(gm);
                gm.setCanView(perm.contains("View") || perm.contains("*"));
                gm.setCanEdit(perm.contains("Edit") || perm.contains("*"));
                gm.setCanDuplicate(perm.contains("Duplicate") || perm.contains("*"));
                gm.setCanInstantiate(perm.contains("Instantiate") || perm.contains("*"));
                gameModels.add(gm);
            }
        }

        return gameModels;
    }

    public void processQuery(String sqlQuery, Map<Long, List<String>> gmMatrix, Map<Long, List<String>> gMatrix, GameModel.Status gmStatus, Game.Status gStatus) {
        TypedQuery<Permission> query = this.getEntityManager().createQuery(sqlQuery, Permission.class);
        User user = requestManager.getCurrentUser();
        query.setParameter("userId", user.getId());
        List<Permission> resultList = query.getResultList();

        for (Permission p : resultList) {
            processPermission(p.getValue(), gmMatrix, gMatrix, gmStatus, gStatus);
            processPermission(p.getInducedPermission(), gmMatrix, gMatrix, gmStatus, gStatus);
        }
    }

    private void processPermission(String permission, Map<Long, List<String>> gmMatrix, Map<Long, List<String>> gMatrix, GameModel.Status gmStatus, Game.Status gStatus) {
        if (permission != null && !permission.isEmpty()) {
            String[] split = permission.split(":");
            if (split.length == 3) {
                String type = null;
                String idPrefix = null;
                Map<Long, List<String>> pMatrix;

                if (split[0].equals("GameModel") && gmStatus != null) {
                    type = "GameModel";
                    idPrefix = "gm";
                    pMatrix = gmMatrix;
                } else if (split[0].equals("Game") && gStatus != null) {
                    type = "Game";
                    idPrefix = "g";
                    pMatrix = gMatrix;
                } else {
                    return;
                }

                String pId = split[2].replaceAll(idPrefix, "");
                ArrayList<Long> ids = new ArrayList<>();
                if (!pId.isEmpty()) {
                    if (pId.equals("*")) {
                        if (type.equals("GameModel")) {
                            for (GameModel gm : this.findByStatus(gmStatus)) {
                                ids.add(gm.getId());
                            }
                        } else { //ie Game
                            for (Game g : gameFacade.findAll(gStatus)) {
                                ids.add(g.getId());
                            }
                        }
                    } else {
                        ids.add(Long.parseLong(pId.replace(idPrefix, "")));
                    }

                    String[] split1 = split[1].split(",");

                    List<String> ps;

                    for (Long id : ids) {
                        if (pMatrix.containsKey(id)) {
                            ps = pMatrix.get(id);
                        } else {
                            ps = new ArrayList();
                            pMatrix.put(id, ps);
                        }

                        for (String perm : split1) {
                            if (!ps.contains(perm)) {
                                ps.add(perm);
                            }
                        }
                    }
                }
            }
        }
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

    /**
     * @return looked-up EJB
     */
    public static GameModelFacade lookup() {
        try {
            return Helper.lookupBy(GameModelFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving gamemodelfacade", ex);
            return null;
        }
    }

    @Schedule(hour = "4", dayOfMonth = "Last Sat")
    public void removeGameModels() {
        List<GameModel> byStatus = this.findByStatus(Status.DELETE);
        for (GameModel gm : byStatus) {
            this.remove(gm);
        }
        this.getEntityManager().flush();
    }
}
