/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ILock;
import com.wegas.core.Helper;
import com.wegas.core.api.GameModelFacadeI;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.event.internal.lifecycle.EntityCreated;
import com.wegas.core.event.internal.lifecycle.PreEntityRemoved;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.merge.patch.WegasEntityPatch;
import com.wegas.core.merge.patch.WegasPatch;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModel.GmType;
import static com.wegas.core.persistence.game.GameModel.GmType.*;
import com.wegas.core.persistence.game.GameModel.Status;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.User;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.ejb.*;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.naming.NamingException;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class GameModelFacade extends BaseFacade<GameModel> implements GameModelFacadeI {

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

    @Inject
    private VariableInstanceFacade variableInstanceFacade;

    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private TeamFacade teamFacade;

    @Inject
    private GameFacade gameFacade;

    @Inject
    private StateMachineFacade stateMachineFacade;

    @Inject I18nFacade i18nFacade;

    @Inject
    private PageFacade pageFacade;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private JCRConnectorProvider jcrConnectorProvider;

    /**
     * Dummy constructor
     */
    public GameModelFacade() {
        super(GameModel.class);
    }

    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public boolean isPersisted(final Long gameModelId) {
        try {
            getEntityManager().createNamedQuery("GameModel.findIdById").setParameter("gameModelId", gameModelId).getSingleResult();
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public void create(final GameModel entity) {

        if (entity.getRawLanguages().isEmpty()) {
            i18nFacade.createLanguage(entity, "en", "English");
        }

        // So What?
        getEntityManager().persist(entity);

        try {
            this.openRepositories(entity);
        } catch (RepositoryException ex) {
            throw WegasErrorMessage.error("Unable to create repository " + ex);
        }

        // create File and history repositories
        final User currentUser = userFacade.getCurrentUser();
        entity.setCreatedBy(!(currentUser.getMainAccount() instanceof GuestJpaAccount) ? currentUser : null); // @hack @fixme, guest are not stored in the db so link wont work

        userFacade.addUserPermission(userFacade.getCurrentUser(), "GameModel:View,Edit,Delete,Duplicate,Instantiate:gm" + entity.getId());

        // HACK (since those values are inferred from permission, but permissions are ignored until effective commit...)
        entity.setCanView(true);
        entity.setCanEdit(true);
        entity.setCanDuplicate(true);
        entity.setCanInstantiate(true);

        variableDescriptorFacade.reviveItems(entity, entity, true); // brand new GameModel -> revive all descriptor
        createdGameModelEvent.fire(new EntityCreated<>(entity));
    }

    /**
     * @param gameModel
     * @param context
     * @param create
     */
    public void propagateAndReviveDefaultInstances(GameModel gameModel, InstanceOwner context, boolean create) {
        this.propagateDefaultInstances(gameModel, context, create);
        this.getEntityManager().flush();
        this.reviveInstances(context);
    }

    /**
     *
     * @param gameModel
     * @param context
     */
    public void createAndRevivePrivateInstance(GameModel gameModel, InstanceOwner context) {
        this.createInstances(gameModel, context);
        this.getEntityManager().flush();
        this.reviveInstances(context);
    }

    /**
     * Create variable instances for owner (not for its children !)
     *
     * @param gameModel the game model which define variabledescriptors
     * @param owner     owner to create instances for
     */
    public void createInstances(GameModel gameModel, InstanceOwner owner) {
        for (VariableDescriptor vd : gameModel.getVariableDescriptors()) {
            vd.createInstances(owner);
        }
        //this.getEntityManager().merge(owner);
    }

    /**
     * Propagate default instance to instances owned
     *
     * @param gameModel
     * @param context
     * @param create
     */
    public void propagateDefaultInstances(GameModel gameModel, InstanceOwner context, boolean create) {
        // Propagate default instances
        for (VariableDescriptor vd : gameModel.getVariableDescriptors()) {
            vd.propagateDefaultInstance(context, create);
        }

    }

    /**
     * Revive instances directly owned by the given owner by firing {@link InstanceRevivedEvent} for each instances
     *
     * @param owner owner to revive instances for
     */
    public void revivePrivateInstances(InstanceOwner owner) {
        for (VariableInstance vi : owner.getPrivateInstances()) {
            variableInstanceFacade.reviveInstance(vi);
        }
    }

    /**
     * Same as {@link #revivePrivateInstances(com.wegas.core.persistence.InstanceOwner) } but also revive instances owned by owner chilidren
     *
     * @param owner instances owner
     */
    public void reviveInstances(InstanceOwner owner) {
        // revive just propagated instances
        for (VariableInstance vi : owner.getAllInstances()) {
            variableInstanceFacade.reviveInstance(vi);
        }
    }

    /**
     * Reset instances with {@link AbstractScope#propagateDefaultInstance(com.wegas.core.persistence.InstanceOwner, boolean)
     * and fire {@link InstanceRevivedEvent} for each reset instances
     *
     * @param vd the variable descriptor to reset the variable for
     */
    public void resetAndReviveScopeInstances(VariableDescriptor vd) {
        vd.getScope().propagateDefaultInstance(null, true);
        this.getEntityManager().flush();
        // revive just propagated instances
        for (VariableInstance vi : (Collection<VariableInstance>) variableDescriptorFacade.getInstances(vd).values()) {
            variableInstanceFacade.reviveInstance(vi);
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
     * Same as {@link #create(com.wegas.core.persistence.game.GameModel) } but add a debug game to the gamemodel
     *
     * @param gm the gameModel to persist
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

                variableInstanceFacade.reviveInstance(dest);
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
            GameModel duplicata = this.createScenario(gameModelId);
            //this.getEntityManager().flush();

            GameModel source = this.find(gameModelId);
            Player player = playerFacade.findLive(playerId);
            setDefaultInstancesFromPlayer(duplicata, source, player);

            this.addDebugGame(duplicata);

            return duplicata;
        } catch (CloneNotSupportedException ex) {
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
     * Find a unique name for this new game (e.g. Oldname (2))
     *
     * @param oName
     *
     * @return new unique name
     */
    public String findUniqueName(String oName, GmType type) {
        String newName = oName != null ? oName : "";

        Pattern p = Pattern.compile("(.*)\\((\\d*)\\)");
        Matcher matcher = p.matcher(oName);

        String baseName;
        Long suffix;
        if (matcher.matches()) {
            baseName = matcher.group(1).trim();
            suffix = Long.decode(matcher.group(2)) + 1;
        } else {
            baseName = newName;
            suffix = 2l;
        }

        while (this.countByName(newName, type) > 0) {
            newName = baseName + " (" + suffix + ")";
            suffix++;
        }
        return newName;

    }

    /**
     * Open both File and History repository through the jctConnectorProvider.
     * <p>
     * If one of the repository does not yet exists, it will be create and saved at JTA commit
     *
     * @param gameModel open repository which belong to this gameModel
     *
     * @throws RepositoryException unable to open repository
     */
    private void openRepositories(GameModel gameModel) throws RepositoryException {
        for (ContentConnector.WorkspaceType wt : ContentConnector.WorkspaceType.values()) {
            ContentConnector connector = jcrConnectorProvider.getContentConnector(gameModel, wt);
        }
    }

    public void duplicateRepository(GameModel newGameModel, GameModel srcGameModel) {
        for (ContentConnector.WorkspaceType wt : ContentConnector.WorkspaceType.values()) {
            try {
                ContentConnector srcRepo = jcrConnectorProvider.getContentConnector(srcGameModel, wt);
                AbstractContentDescriptor srcRoot = DescriptorFactory.getDescriptor("/", srcRepo);

                ContentConnector newRepo = jcrConnectorProvider.getContentConnector(newGameModel, wt);
                AbstractContentDescriptor newRoot = DescriptorFactory.getDescriptor("/", newRepo);

                WegasPatch patch = new WegasEntityPatch(newRoot, srcRoot, true);

                patch.applyForce(newGameModel, newRoot);
            } catch (RepositoryException ex) {
                throw WegasErrorMessage.error("Duplicating repository gm_" + srcGameModel.getId() + " failure: " + ex);
            }
        }
    }

    public GameModel createPlayGameModel(final Long entityId) throws CloneNotSupportedException {
        final GameModel srcGameModel = this.find(entityId);                     // Retrieve the entity to duplicate
        GameModel newGameModel = this.duplicate(entityId);
        if (srcGameModel != null && newGameModel != null) {

            // Clear comments
            newGameModel.setComments("");
            // to right restriction for trainer, status PLAY/LIVE must be set before persisting the gameModel
            newGameModel.setStatus(GameModel.Status.LIVE);
            newGameModel.setType(PLAY);
            newGameModel.setBasedOn(srcGameModel);

            this.create(newGameModel);

            this.duplicateRepository(newGameModel, srcGameModel);

            return newGameModel;
        } else {
            throw new WegasNotFoundException("GameModel not found");
        }
    }

    /**
     *
     * @param entityId
     *
     * @return
     *
     * @throws CloneNotSupportedException
     */
    @Override
    public GameModel duplicate(final Long entityId) throws CloneNotSupportedException {
        final GameModel srcGameModel = this.find(entityId);
        if (srcGameModel != null) {
            return (GameModel) srcGameModel.duplicate();
        }
        return null;
    }

    /**
     * Duplicate a model to create a brand new one.
     * The srcGameModel must be a model.
     *
     * @param entityId id of the model to duplicate must be a MODEL gameModel.
     *
     * @return
     *
     * @throws CloneNotSupportedException
     */
    public GameModel createModel(final Long entityId) throws CloneNotSupportedException {
        final GameModel srcGameModel = this.find(entityId);

        if (srcGameModel != null) {
            if (srcGameModel.getType().equals(MODEL)) {
                requestManager.assertCanDuplicateGameModel(this.find(entityId));

                GameModel newGameModel = this.duplicate(entityId);
                if (newGameModel != null) {

                    // make sure the new GameModel is a MODEL
                    newGameModel.setType(MODEL);

                    // add a suffix to the name
                    newGameModel.setName(this.findUniqueName(srcGameModel.getName(), MODEL));

                    // new refIds
                    MergeHelper.resetRefIds(newGameModel, null);

                    // persist
                    this.create(newGameModel);

                    this.duplicateRepository(newGameModel, srcGameModel);
                    return newGameModel;
                } else {
                    throw WegasErrorMessage.error("Unable to duplicate srcModel");
                }
            } else {
                throw WegasErrorMessage.error("Model to duplicate is not a model");
            }
        } else {
            throw new WegasNotFoundException("GameModel not found");
        }
    }

    /**
     * Create a new scenario based on another gameModel (the source).
     * The source GameModel must be either a MODEL or a SCENARIO.
     * <ul>
     * <li><b>MODEL:</b> the new scenario will be a copy of the model,
     * whithout any PRIVATE content.</li>
     * <li><b>SCENARIO:</b> the new scenario will be a copy of the source, including PRIVATE content</li>
     * </ul>
     *
     * @param sourceId id of the gameModel to based the new one on
     *
     * @return a new SCENARIO gameModel
     *
     * @throws CloneNotSupportedException
     */
    public GameModel createScenario(final Long sourceId) throws CloneNotSupportedException {
        final GameModel srcGameModel = this.find(sourceId);

        if (srcGameModel != null) {

            GameModel newGameModel = null;
            switch (srcGameModel.getType()) {
                case MODEL:
                    requestManager.assertCanInstantiateGameModel(srcGameModel);
                    newGameModel = new GameModel();
                    // merge deep but skip PRIVATE content
                    newGameModel.deepMerge(srcGameModel);
                    newGameModel.setBasedOn(srcGameModel);
                    break;
                case SCENARIO:
                    requestManager.assertCanDuplicateGameModel(srcGameModel);
                    newGameModel = this.duplicate(sourceId);
                    // duplicating a scenario which is based on a model
                    newGameModel.setBasedOn(srcGameModel.getBasedOn());
                    break;
                case PLAY:
                    GameModel basedOn = srcGameModel.getBasedOn();
                    if (basedOn != null) {
                        requestManager.assertCanDuplicateGameModel(basedOn);
                        newGameModel = this.duplicate(sourceId);
                        newGameModel.setBasedOn(srcGameModel.getBasedOn());
                        break;
                    }
                default:
                    throw new WegasIncompatibleType("Couldn not create a new scenario from " + srcGameModel);
            }

            if (newGameModel != null) {
                newGameModel.setName(this.findUniqueName(srcGameModel.getName(), SCENARIO));

                // one should be able to create/modifiy everything
                newGameModel.setOnGoingPropagation(Boolean.TRUE);
                this.create(newGameModel);

                newGameModel.setType(SCENARIO);

                this.duplicateRepository(newGameModel, srcGameModel);
                newGameModel.setOnGoingPropagation(Boolean.FALSE);
                return newGameModel;
            } else {
                throw WegasErrorMessage.error("Something went wrong");
            }
        } else {
            throw new WegasNotFoundException("GameModel not found");
        }
    }

    /**
     * Create a new model based on the given one.
     *
     * @param gameModelId id of the model to duplicate
     *
     * @return a new model
     *
     * @throws CloneNotSupportedException
     */
    public GameModel createModelWithDebugGame(final Long gameModelId) throws CloneNotSupportedException {
        GameModel gm = this.createModel(gameModelId);

        this.addDebugGame(gm);
        return gm;
    }

    /**
     * @param gameModelId
     *
     * @return gameModel copy
     *
     * @throws java.lang.CloneNotSupportedException
     *
     */
    public GameModel createScenarioWithDebugGame(final Long gameModelId) throws CloneNotSupportedException {
        GameModel gm = this.createScenario(gameModelId);
        this.addDebugGame(gm);
//        userFacade.duplicatePermissionByInstance("gm" + gameModelId, "gm" + gm.getId());
        return gm;
    }

    public List<GameModel> getImplementations(GameModel gm) {
        TypedQuery<GameModel> query = this.getEntityManager().createNamedQuery("GameModel.findAllInstantiations", GameModel.class);
        query.setParameter("id", gm.getId());
        return query.getResultList();
    }

    @Override
    public void remove(final GameModel gameModel) {
        final Long id = gameModel.getId();
        userFacade.deletePermissions(gameModel);

        TypedQuery<GameModel> query = this.getEntityManager().createNamedQuery("GameModel.findAllInstantiations", GameModel.class);
        query.setParameter("id", id);
        List<GameModel> instantiations = query.getResultList();

        for (GameModel instantiation : instantiations) {
            instantiation.setBasedOn(null);
            if (gameModel.isModel() && instantiation.getType().equals(GmType.REFERENCE)) {
                this.remove(instantiation);
            }
        }

        for (Game g : this.find(id).getGames()) {
            userFacade.deletePermissions(g);
        }
        preRemovedGameModelEvent.fire(new PreEntityRemoved<>(this.find(id)));
        getEntityManager().remove(gameModel);
        // Remove pages.
        try {
            pageFacade.deletePages(gameModel);
        } catch (RepositoryException e) {
            logger.error("Error suppressing pages for gameModel {}, {}", id, e.getMessage());
        }

        for (ContentConnector.WorkspaceType wt : ContentConnector.WorkspaceType.values()) {
            try {
                ContentConnector connector = jcrConnectorProvider.getContentConnector(gameModel, wt);
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
     * @param gmType
     * @param status
     *
     * @return all gameModel matching the given status
     */
    public List<GameModel> findByTypeAndStatus(final GameModel.GmType gmType, final GameModel.Status status) {
        final TypedQuery<GameModel> query = getEntityManager().createNamedQuery("GameModel.findByTypeAndStatus", GameModel.class);
        query.setParameter("type", gmType);
        query.setParameter("status", status);
        return query.getResultList();
    }

    /**
     * @param name
     * @param type
     *
     * @return the number of gamemodel having the given name
     */
    public long countByName(final String name, GmType type) {
        final TypedQuery<Long> query;

        if (type == MODEL) {
            query = getEntityManager().createNamedQuery("GameModel.countModelByName", Long.class);
        } else {
            query = getEntityManager().createNamedQuery("GameModel.countByName", Long.class);
        }

        query.setParameter("name", name);
        try {
            return query.getSingleResult();
        } catch (NoResultException ex) {
            return 0l;
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
        stateMachineFacade.runStateMachines(gameModel);
    }

    @Override
    public void reset(final Game game) {
        gameFacade.reset(game);
    }

    @Override
    public void reset(final Team team) {
        teamFacade.reset(team);
    }

    @Override
    public void reset(final Player player) {
        playerFacade.reset(player);
    }

    public void resetGame(final Player player) {
        gameFacade.reset(player.getGame());
    }

    public void resetTeam(final Player player) {
        teamFacade.reset(player.getTeam());
    }

    public Collection<GameModel> findByTypeStatusAndUser(GameModel.GmType type,
            GameModel.Status status) {
        ArrayList<GameModel> gameModels = new ArrayList<>();
        Map<Long, List<String>> pMatrix = new HashMap<>();

        String roleQuery = "SELECT p FROM Permission p WHERE "
                + "(p.role.id in "
                + "    (SELECT r.id FROM User u JOIN u.roles r WHERE u.id = :userId)"
                + ")";

        String userQuery = "SELECT p FROM Permission p WHERE p.user.id = :userId ";

        this.processQuery(userQuery, pMatrix, null, type, status, null);
        this.processQuery(roleQuery, pMatrix, null, type, status, null);

        for (Map.Entry<Long, List<String>> entry : pMatrix.entrySet()) {
            Long id = entry.getKey();
            GameModel gm = this.find(id);
            if (gm != null && gm.getType() == type && gm.getStatus() == status) {
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

    public void processQuery(String sqlQuery, Map<Long, List<String>> gmMatrix, Map<Long, List<String>> gMatrix, GameModel.GmType gmType, GameModel.Status gmStatus, Game.Status gStatus) {
        TypedQuery<Permission> query = this.getEntityManager().createQuery(sqlQuery, Permission.class);
        User user = userFacade.getCurrentUser();
        query.setParameter("userId", user.getId());
        List<Permission> resultList = query.getResultList();

        for (Permission p : resultList) {
            processPermission(p.getValue(), gmMatrix, gMatrix, gmType, gmStatus, gStatus);
        }
    }

    private void processPermission(String permission, Map<Long, List<String>> gmMatrix, Map<Long, List<String>> gMatrix, GameModel.GmType gmType, GameModel.Status gmStatus, Game.Status gStatus) {
        if (permission != null && !permission.isEmpty()) {
            String[] split = permission.split(":");
            if (split.length == 3) {
                String type = null;
                String idPrefix = null;
                Map<Long, List<String>> pMatrix;

                if (split[0].equals("GameModel") && gmStatus != null && gmType != null) {
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
                            for (GameModel gm : this.findByTypeAndStatus(gmType, gmStatus)) {
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
        requestManager.su();
        try {
            ILock lock = hzInstance.getLock("GameModelFacade.Schedule");
            logger.info("deleteGameModels(): want to delete gameModels");
            if (lock.tryLock()) {
                try {
                    List<GameModel> toDelete = this.findByTypeAndStatus(SCENARIO, Status.DELETE);
                    toDelete.addAll(this.findByTypeAndStatus(MODEL, Status.DELETE));

                    for (GameModel gm : toDelete) {
                        this.remove(gm);
                    }
                    this.getEntityManager().flush();
                } finally {
                    lock.unlock();
                    lock.destroy();
                }
            } else {
                logger.info("somebody else got the lock...");
            }

        } finally {
            requestManager.releaseSu();
        }
    }
}
