/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.wegas.core.Helper;
import com.wegas.core.api.GameModelFacadeI;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.event.internal.lifecycle.EntityCreated;
import com.wegas.core.event.internal.lifecycle.PreEntityRemoved;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.ContentConnector.WorkspaceType;
import com.wegas.core.jcr.content.DescriptorFactory;
import com.wegas.core.jcr.content.DirectoryDescriptor;
import com.wegas.core.jcr.content.FileDescriptor;
import com.wegas.core.jcr.helpers.FileMeta;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.merge.patch.WegasEntityPatch;
import com.wegas.core.merge.patch.WegasPatch;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModel.GmType;
import static com.wegas.core.persistence.game.GameModel.GmType.MODEL;
import static com.wegas.core.persistence.game.GameModel.GmType.PLAY;
import static com.wegas.core.persistence.game.GameModel.GmType.SCENARIO;
import com.wegas.core.persistence.game.GameModel.Status;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.User;
import com.wegas.core.tools.FindAndReplacePayload;
import com.wegas.core.tools.FindAndReplaceVisitor;
import com.wegas.core.tools.RegexExtractorVisitor;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.attribute.FileTime;
import java.text.Collator;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import javax.ejb.Asynchronous;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.naming.NamingException;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.StreamingOutput;
import org.apache.commons.io.IOUtils;
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
    @Inject
    private UserFacade userFacade;

    /**
     *
     */
    @Inject
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

    @Inject
    private I18nFacade i18nFacade;

    @Inject
    private PageFacade pageFacade;

    @Inject
    private JCRConnectorProvider jcrConnectorProvider;

    @Inject
    private JCRFacade jcrFacade;

    @Inject
    private WebsocketFacade websocketFacade;

    @Inject
    private ModelFacade modelFacade;

    /**
     * Dummy constructor
     */
    public GameModelFacade() {
        super(GameModel.class);
    }

    /**
     * Duplicate game model. Handle MODEL and SCENARIO.
     *
     * @param entityId id of the gamemodel to duplicate
     *
     * @return a new model or a new scenario
     *
     * @throws CloneNotSupportedException
     */
    public GameModel duplicateGameModel(Long entityId) throws CloneNotSupportedException {
        GameModel gm = this.find(entityId);
        switch (gm.getType()) {
            case MODEL:
                return this.createModelWithDebugGame(entityId);
            case SCENARIO:
                return this.createScenarioWithDebugGame(entityId);
            default:
                throw new WegasIncompatibleType("Invalid gameModel type");
        }
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

        /*
         * This flush is required by several EntityRevivedEvent listener, which opperate some SQL
         * queries (which didn't return anything before entites have been flushed to database
         *
         * for instance, reviving a taskDescriptor needs to fetch others tasks by name, it will not
         * return any result if this flush not occurs
         */
        variableDescriptorFacade.flush();

        variableDescriptorFacade.reviveItems(entity, entity, true); // brand new GameModel -> revive all descriptor

        variableDescriptorFacade.flush();

        variableDescriptorFacade.reviveAllScopedInstances(entity);

        createdGameModelEvent.fire(new EntityCreated<>(entity));
    }

    /**
     * Patch gameModel with newVersion. TODO: patch files as well
     *
     * @param gameModel  the gameModel to patch
     * @param newVersion the new version
     *
     * @return
     */
    public GameModel patch(GameModel gameModel, GameModel newVersion) throws RepositoryException {
        List<GameModel> toPatch = new ArrayList<>();
        toPatch.add(gameModel);

        newVersion.setName(gameModel.getName());
        newVersion.setComments(gameModel.getComments());

        modelFacade.processLanguages(newVersion, toPatch);
        // ensure variable tree is up to date with newVersion's
        modelFacade.fixVariableTree(newVersion, toPatch, false);
        // merge recusrsively and bypass visibility restriction
        gameModel.deepMergeForce(newVersion);

        // revive descriptor & propagate default instances
        variableDescriptorFacade.reviveItems(gameModel, gameModel, false);

        this.getEntityManager().flush();
        variableDescriptorFacade.reviveAllScopedInstances(gameModel);
        return gameModel;
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
     * Revive instances directly owned by the given owner by firing {@link InstanceRevivedEvent} for
     * each instances
     *
     * @param owner owner to revive instances for
     */
    public void revivePrivateInstances(InstanceOwner owner) {
        for (VariableInstance vi : owner.getPrivateInstances()) {
            variableInstanceFacade.reviveInstance(vi);
        }
    }

    /**
     * Same as {@link #revivePrivateInstances(com.wegas.core.persistence.InstanceOwner) } but also
     * revive instances owned by owner chilidren
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
     *
     * @param vd the variable descriptor to reset the variable for
     */
    public void resetScopedInstances(VariableDescriptor vd) {
        vd.getScope().propagateDefaultInstance(null, true);
    }

    /**
     * Revive scoped instances
     *
     * @param vd the variable descriptor to reset the variable for
     */
    public void reviveScopedInstances(VariableDescriptor vd) {
        for (VariableInstance vi : (Collection<VariableInstance>) variableDescriptorFacade.getInstances(vd).values()) {
            variableInstanceFacade.reviveInstance(vi);
        }
    }

    /**
     * Add a DebugGame (and debug team) within the given game model unless it already exists
     *
     * @param gameModel
     *
     * @return true if a new debugGame has been added, false if the gameModel already has one
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
     * Same as {@link #create(com.wegas.core.persistence.game.GameModel) } but add a debug game to
     * the gamemodel
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
            }

            for (VariableDescriptor vd : toUpdate.getVariableDescriptors()) {
                vd = variableDescriptorFacade.find(vd.getId());
                VariableInstance dest = vd.getDefaultInstance();
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

            duplicata.setOnGoingPropagation(true);
            this.addDebugGame(duplicata);
            duplicata.setOnGoingPropagation(false);

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
     * Find all distinct logId
     *
     * @return list of all logID in use
     */
    public List<String> findDistinctLogIds() {
        TypedQuery<String> query = this.getEntityManager()
            .createNamedQuery("GameModel.findDistinctLogIds", String.class);
        return query.getResultList();
    }

    /**
     * Find a unique logId
     *
     * @param oName
     *
     * @return new unique name
     */
    public String findUniqueLogId(String oName) {
        List<String> usedLogIds = this.findDistinctLogIds();

        String newName = oName != null ? oName : "newLogId";
        return Helper.findUniqueLabel(newName, usedLogIds);
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
            jcrConnectorProvider.getContentConnector(gameModel, wt);
        }
    }

    /**
     * Extract gameModel from a WGZ export.
     *
     * @param zip a WGZ archive
     *
     * @return the (unpersisted) gameModel
     *
     * @throws IOException
     * @throws RepositoryException
     */
    public GameModel extractGameModelFromWGZ(ZipInputStream zip) throws IOException, RepositoryException {
        ZipEntry entry;
        GameModel gameModel = null;
        InputStream filesStream = null;
        InputStream gameModelStream = null;

        while ((entry = zip.getNextEntry()) != null) { // NOPMD
            if (entry.getName().equals("gamemodel.json")) {
                gameModelStream = IOUtils.toBufferedInputStream(zip);
            } else if (entry.getName().equals("files.xml")) {
                filesStream = IOUtils.toBufferedInputStream(zip);
            } else {
                throw new WegasIncompatibleType("Invalid zip entry " + entry.getName());
            }
        }

        if (gameModelStream != null && filesStream != null) {
            gameModel = JacksonMapperProvider.getMapper().readValue(gameModelStream, GameModel.class);
//            ContentConnector connector = jcrConnectorProvider.getContentConnector(gameModel, WorkspaceType.FILES);
//            connector.importXML(filesStream);
        }

        return gameModel;
    }

    public GameModel createFromWgz(ZipInputStream zip) throws IOException, RepositoryException {
        ZipEntry entry;
        GameModel gameModel = null;
        InputStream filesStream = null;
        InputStream gameModelStream = null;

        while ((entry = zip.getNextEntry()) != null) { // NOPMD
            if (entry.getName().equals("gamemodel.json")) {
                gameModelStream = IOUtils.toBufferedInputStream(zip);
            } else if (entry.getName().equals("files.xml")) {
                filesStream = IOUtils.toBufferedInputStream(zip);
            } else {
                throw new WegasIncompatibleType("Invalid zip entry " + entry.getName());
            }
        }

        if (gameModelStream != null && filesStream != null) {
            gameModel = JacksonMapperProvider.getMapper().readValue(gameModelStream, GameModel.class);

            gameModel.setName(this.findUniqueName(gameModel.getName(), SCENARIO));
            this.createWithDebugGame(gameModel);

            ContentConnector connector = jcrConnectorProvider.getContentConnector(gameModel, WorkspaceType.FILES);
            connector.importXML(filesStream);
        }

        return gameModel;
    }

    /**
     * Archive game model in a WegasZip (WGZ). Archive will contains
     * <li>gamemodel.json
     * <li>files.xml
     *
     * @param gameModelId id of the gameModel to export
     *
     * @return the wgz-achived outputstreamed
     *
     * @throws RepositoryException in case the JCR files repository is not available
     */
    public StreamingOutput archiveAsWGZ(Long gameModelId) throws RepositoryException {

        GameModel gameModel = this.find(gameModelId);

        StreamingOutput out;
        out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try ( ZipOutputStream zipOutputStream = new ZipOutputStream(output, StandardCharsets.UTF_8)) {

                    // serialise the json
                    ZipEntry gameModelEntry = new ZipEntry("gamemodel.json");
                    zipOutputStream.putNextEntry(gameModelEntry);
                    byte[] json = JacksonMapperProvider.getMapper().writerWithView(Views.Export.class).writeValueAsBytes(gameModel);
                    zipOutputStream.write(json);

                    zipOutputStream.closeEntry();

                    ZipEntry filesEntry = new ZipEntry("files.xml");
                    zipOutputStream.putNextEntry(filesEntry);

                    ContentConnector connector = jcrConnectorProvider.getContentConnector(gameModel, WorkspaceType.FILES);
                    try {
                        connector.exportXML(zipOutputStream);
                        zipOutputStream.closeEntry();
                    } finally {
                        if (!connector.getManaged()) {
                            connector.rollback();
                        }
                    }

                } catch (RepositoryException ex) {
                    logger.error(null, ex);
                }
            }
        };

        return out;
    }

    private String mimeTypeToExtension(String mimeType) {
        switch (mimeType) {
            case "css":
            case "text/css":
                return ".css";
            case "application/json":
            case "json":
                return ".json";
            case "application/typescript":
                return ".ts";
            case "application/javascript":
                return ".js";
            default:
                return ".txt";
        }
    }

    private String extensionToMimeType(String ext) {
        switch (ext) {
            case "css":
                return "text/css";
            case "json":
                return "application/json";
            case "ts":
                return "application/typescript";
            case "js":
                return "application/javascript";
            default:
                return "text/plain";
        }
    }

    private static final String NO_SLASH_GROUP = "([^/]+)";

    private static final String GM_PREFIX = "/gameModel/";
    private static final String LIBS_PREFIX = GM_PREFIX + "libs/";
    private static final String PAGES_PREFIX = GM_PREFIX + "pages/";
    private static final String FILES_PREFIX = GM_PREFIX + "files"; // No leading slash !

    private static final String FILESMETA_PREFIX = GM_PREFIX + "filesmeta.json";
    private static final String GM_DOT_JSON_NAME = GM_PREFIX + "gamemodel.json";

    private static final Pattern LIB_PATTERN = Pattern.compile(LIBS_PREFIX
        + NO_SLASH_GROUP// libType
        + "/" + NO_SLASH_GROUP// libName
        + "\\." + NO_SLASH_GROUP); //libExtension

    private static final Pattern PAGE_PATTERN = Pattern.compile(PAGES_PREFIX
        + NO_SLASH_GROUP// pageId
        + "\\.json"); //libExtension

    private static final Pattern FILE_PATTERN = Pattern.compile(FILES_PREFIX + "(.*)"); //libExtension

    /**
     * Extract the gameModel as an archived file directory.
     * <ul>
     * <li> /gamemodel.json <em>variables</em>
     * <li> /libraries/
     * <ul>
     * <li> ./libType/  <em>a subfolder for each kind of libs</em>
     * <ul>
     * <li> ./libFiles.xyz
     * </ul>
     * </ul>
     * <li> /pages/
     * <ul>
     * <li> ./page_x.json
     * </ul>
     * <li> /files/
     * </ul>
     *
     * @param gameModelId id of the gameModel to export
     *
     * @return the wgz-achived outputstreamed
     *
     */
    public StreamingOutput archiveAsExplodedZip(Long gameModelId) throws CloneNotSupportedException {

        GameModel oriGameModel = this.find(gameModelId);
        GameModel gameModel = (GameModel) oriGameModel.duplicate();
        //GameModel gameModel = this.find(gameModelId);

        StreamingOutput out;
        out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try ( ZipOutputStream zipOutputStream = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
                    ObjectMapper mapper = JacksonMapperProvider.getMapper();
                    mapper.enable(SerializationFeature.INDENT_OUTPUT);
                    mapper.enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS);
                    mapper.enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY);

                    Map<String, Map<String, GameModelContent>> libraries = gameModel.getLibrariesAsMap();

                    zipOutputStream.putNextEntry(new ZipEntry(GM_PREFIX));
                    zipOutputStream.closeEntry();

                    /* export Libraries */
                    zipOutputStream.putNextEntry(new ZipEntry(LIBS_PREFIX));
                    zipOutputStream.closeEntry();
                    for (var libTypeentry : libraries.entrySet()) {
                        String libType = libTypeentry.getKey();
                        Map<String, GameModelContent> list = libTypeentry.getValue();
                        zipOutputStream.putNextEntry(new ZipEntry(LIBS_PREFIX + libType + "/"));
                        zipOutputStream.closeEntry();

                        for (var libEntry : list.entrySet()) {
                            String libName = libEntry.getKey();
                            GameModelContent lib = libEntry.getValue();

                            String extension = mimeTypeToExtension(lib.getContentType());
                            ZipEntry zipLib = new ZipEntry(LIBS_PREFIX + libType + "/" + libName + extension);
                            zipOutputStream.putNextEntry(zipLib);
                            zipOutputStream.write(lib.getContent().getBytes(StandardCharsets.UTF_8));
                            zipOutputStream.closeEntry();

                            // clear lib content so it won't be serialized twice
                            lib.setContent("");

                            // hence, library are splitted:
                            //  library content is exported in its own lib file
                            //  library meta are kept in the gameModel JSON structure
                        }
                    }
                    // sort libs before serialization. (to simplify comparision aka git coflict)
                    List<GameModelContent> libsList = gameModel.getLibraries();
                    Collator collator = Collator.getInstance();
                    libsList.sort((GameModelContent libA, GameModelContent libB) -> {
                        // First sort by type
                        int typeCompare = collator.compare(libA.getLibraryType(), libB.getLibraryType());
                        if (typeCompare == 0) {
                            // libs of same type: sort by name
                            return collator.compare(libA.getContentKey(), libB.getContentKey());
                        } else {
                            return typeCompare;
                        }
                    });

                    /* export Pages */
                    zipOutputStream.putNextEntry(new ZipEntry(PAGES_PREFIX));
                    zipOutputStream.closeEntry();

  //                  JsonFactory factory = new JsonFactory();

                    Map<String, JsonNode> pages = gameModel.getPages();
                    for (var pageEntry : pages.entrySet()) {
                        String pageId = pageEntry.getKey();
                        JsonNode value = pageEntry.getValue();

                        // Hack: make sure to indent and sort properties
                        // export JSONNode-encoded page to string
                        // parse the string to get a full java object
                        // Serialize object to json using the mapper with the custom config
                        String toString = value.toString();
                        Map javaPage = mapper.readValue(toString, Map.class);
                        byte[] bytes = mapper.writeValueAsBytes(javaPage);

                        ZipEntry page = new ZipEntry(PAGES_PREFIX + pageId + ".json");
                        zipOutputStream.putNextEntry(page);
                        zipOutputStream.write(bytes);
                        zipOutputStream.closeEntry();
                    }

                    // At the end, serialize the GameModel to JSON
                    // clear pages so they won't be serialized again
                    gameModel.setPages(new HashMap());
                    ZipEntry gameModelEntry = new ZipEntry(GM_DOT_JSON_NAME);
                    zipOutputStream.putNextEntry(gameModelEntry);
                    byte[] json = mapper.writerWithView(Views.Export.class).writeValueAsBytes(gameModel);
                    zipOutputStream.write(json);
                    zipOutputStream.closeEntry();

                    ContentConnector connector = jcrConnectorProvider.getContentConnector(oriGameModel, WorkspaceType.FILES);
                    AbstractContentDescriptor descriptor = DescriptorFactory.getDescriptor("/", connector);

                    Map<String, FileMeta> meta = new HashMap<>();
                    writeRepositoryEntry(zipOutputStream, descriptor, meta);

                    // Write files meta
                    ZipEntry metaEntry = new ZipEntry(FILESMETA_PREFIX);
                    zipOutputStream.putNextEntry(metaEntry);
                    byte[] metaJson = mapper.writeValueAsBytes(meta);
                    zipOutputStream.write(metaJson);
                    zipOutputStream.closeEntry();
                } catch (RepositoryException ex) {
                    logger.error(null, ex);
                }
            }
        };

        return out;
    }

    private void writeRepositoryEntry(ZipOutputStream zipOutputStream, AbstractContentDescriptor descriptor, Map<String, FileMeta> meta) throws IOException, RepositoryException {
        String path = descriptor.getFullPath();

        FileMeta fileMeta = new FileMeta();

        fileMeta.setDescription(descriptor.getDescription());
        fileMeta.setNote(descriptor.getNote());
        fileMeta.setMimeType(descriptor.getMimeType());
        fileMeta.setVisibility(descriptor.getVisibility());

        meta.put(path, fileMeta);

        if (descriptor instanceof DirectoryDescriptor) {
            ZipEntry dirEntry = new ZipEntry(FILES_PREFIX + path);
            zipOutputStream.putNextEntry(dirEntry);
            zipOutputStream.closeEntry();

            DirectoryDescriptor dir = (DirectoryDescriptor) descriptor;
            for (var child : dir.getChildren()) {
                writeRepositoryEntry(zipOutputStream, child, meta);
            }
        } else if (descriptor instanceof FileDescriptor) {
            FileDescriptor file = (FileDescriptor) descriptor;
            byte[] bytesData = file.getBytesData();

            ZipEntry fileEntry = new ZipEntry(FILES_PREFIX + path);

            Calendar dataLastModified = file.getDataLastModified();
            long ts = dataLastModified.getTimeInMillis();
            FileTime mTime = FileTime.from(ts, TimeUnit.MILLISECONDS);
            fileEntry.setLastModifiedTime(mTime);
            zipOutputStream.putNextEntry(fileEntry);
            zipOutputStream.write(bytesData);
            zipOutputStream.closeEntry();
        }

    }

    public static class RecombinedGameModel {

        GameModel gameModel = null;

        Set<String> directories = new HashSet<>();

        Map<String, FileMeta> filesMeta = new HashMap<>();
        Map<String, FileTime> modificationTimes = new HashMap<>();
        Map<String, byte[]> filesData = new HashMap<>();

        public GameModel getGameModel() {
            return gameModel;
        }

        public void setGameModel(GameModel gameModel) {
            this.gameModel = gameModel;
        }

        public Map<String, FileMeta> getFilesMeta() {
            return filesMeta;
        }

        public void setFilesMeta(Map<String, FileMeta> filesMeta) {
            this.filesMeta = filesMeta;
        }

        public Map<String, FileTime> getModificationTimes() {
            return modificationTimes;
        }

        public void setModificationTimes(Map<String, FileTime> modificationTimes) {
            this.modificationTimes = modificationTimes;
        }

        public Map<String, byte[]> getFilesData() {
            return filesData;
        }

        public void setFilesData(Map<String, byte[]> filesData) {
            this.filesData = filesData;
        }

        public Set<String> getDirectories() {
            return directories;
        }

        public void setDirectories(Set<String> directories) {
            this.directories = directories;
        }
    }

    /**
     *
     * @param zip zip stream to read
     *
     * @return recombined gameModel
     *
     * @throws IOException
     */
    public RecombinedGameModel extractFromExplodedZip(ZipInputStream zip) throws IOException {
        ZipEntry entry;
        RecombinedGameModel rgm = new RecombinedGameModel();

        Map<String, JsonNode> pages = new HashMap<>();
        List<GameModelContent> libs = new ArrayList<>();

        Map<String, FileTime> mTimes = rgm.getModificationTimes();
        Map<String, byte[]> filesData = rgm.getFilesData();
        Set<String> directories = rgm.getDirectories();

        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        while ((entry = zip.getNextEntry()) != null) {
            String entryName = entry.getName();
            if (entryName.charAt(0) != '/') {
                entryName = "/" + entryName;
            }
            if (GM_DOT_JSON_NAME.equals(entryName)) {
                InputStream stream = IOUtils.toBufferedInputStream(zip);
                rgm.setGameModel(mapper.readValue(stream, GameModel.class));
            } else if (FILESMETA_PREFIX.equals(entryName)) {
                InputStream stream = IOUtils.toBufferedInputStream(zip);

                TypeReference<HashMap<String, FileMeta>> typeRef = new TypeReference<>() {
                };

                rgm.setFilesMeta(mapper.readValue(stream, typeRef));
            } else {
                Matcher matcher = LIB_PATTERN.matcher(entryName);
                if (matcher.matches()) {
                    String libType = matcher.group(1);

                    String libName = matcher.group(2);

                    String mimeType = extensionToMimeType(matcher.group(3));
                    String libContent = IOUtils.toString(zip, StandardCharsets.UTF_8);

                    libs.add(new GameModelContent(libName, libContent, mimeType, libType));
                } else {
                    matcher = PAGE_PATTERN.matcher(entryName);
                    if (matcher.matches()) {
                        String pageId = matcher.group(1);
                        String jsonPage = IOUtils.toString(zip, StandardCharsets.UTF_8);
                        JsonNode page = mapper.readTree(jsonPage);
                        pages.put(pageId, page);
                    } else {
                        matcher = FILE_PATTERN.matcher(entryName);
                        if (matcher.matches()) {
                            String path = matcher.group(1);
                            if (path.endsWith("/")) {
                                // directories
                                directories.add(path);
                            } else {
                                // files
                                filesData.put(path, IOUtils.toByteArray(zip));
                                mTimes.put(path, entry.getLastModifiedTime());
                            }
                        }
                    }
                }
            }
        }

        if (rgm.getGameModel() != null) {
            GameModel gameModel = rgm.getGameModel();
            gameModel.setPages(pages);

            // try to set lib content back
            List<GameModelContent> gmLibs = gameModel.getLibraries();
            libs.forEach(lib -> {
                Optional<GameModelContent> find = gmLibs.stream()
                    .filter(l -> {
                        return l.getLibraryType().equals(lib.getLibraryType())
                            && l.getContentKey().equals(lib.getContentKey());
                    })
                    .findFirst();
                if (find.isPresent()) {
                    // restore content
                    find.get().setContent(lib.getContent());
                } else {
                    // new lib
                    gmLibs.add(lib);
                }
            });
            //gameModel.setLibraries(libs);
            return rgm;
        }

        return null;
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
        /* clear .user-uploads this special directory contains files uploaded by players. Hence, it
         * has to be erase
         */
        jcrFacade.deleteUserUploads(newGameModel);
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
            if (!srcGameModel.getPages().isEmpty()) {
                // make sure to have an up-to-date page index before the copy
                try {
                    pageFacade.getPageIndex(srcGameModel);
                } catch (RepositoryException | JsonProcessingException ex) {
                    logger.warn("Unable to getIndex");
                }
            }
            return (GameModel) srcGameModel.duplicate();
        }
        return null;
    }

    /**
     * Duplicate a model to create a brand new one. The srcGameModel must be a model.
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
            if (srcGameModel.isModel()) {
                requestManager.assertCanDuplicateGameModel(this.find(entityId));

                GameModel newGameModel = this.duplicate(entityId);
                if (newGameModel != null) {

                    // make sure the new GameModel is a MODEL
                    newGameModel.setType(MODEL);

                    // add a suffix to the name
                    newGameModel.setName(this.findUniqueName(srcGameModel.getName(), MODEL));

                    // new refIds
                    MergeHelper.resetRefIds(newGameModel, null, true);

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
     * Create a new scenario based on another gameModel (the source). The source GameModel must be
     * either a MODEL or a SCENARIO.
     * <ul>
     * <li><b>MODEL:</b> the new scenario will be a copy of the model, whithout any PRIVATE
     * content.</li>
     * <li><b>SCENARIO:</b> the new scenario will be a copy of the source, including PRIVATE
     * content</li>
     * </ul>
     *
     * @param sourceId id of the gameModel to based the new one on
     *
     * @return a new SCENARIO gameModel
     *
     * @throws CloneNotSupportedException
     */
    public GameModel createScenario(final Long sourceId) throws CloneNotSupportedException {
        GameModel srcGameModel = this.find(sourceId);

        if (srcGameModel != null) {

            GameModel newGameModel = null;
            switch (srcGameModel.getType()) {
                case MODEL:
                    requestManager.assertCanInstantiateGameModel(srcGameModel);
                    // prefer the reference
                    GameModel theModel = srcGameModel;
                    GameModel ref = modelFacade.getReference(srcGameModel);
                    if (ref != null) {
                        srcGameModel = ref;
                    }
                    newGameModel = new GameModel();
                    // merge deep but skip PRIVATE content
                    newGameModel.deepMerge(srcGameModel);
                    newGameModel.setBasedOn(theModel);
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

                if (!Helper.isNullOrEmpty(newGameModel.getProperties().getLogID())) {
                    newGameModel.getProperties().setLogID(findUniqueLogId(newGameModel.getProperties().getLogID()));
                }

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

    /**
     * Do a JPA query to fetch the reference of the given model.
     *
     * @param gm the model
     *
     * @return the reference of the model or null
     */
    public GameModel findReference(GameModel gm) {
        try {
            TypedQuery<GameModel> query = this.getEntityManager().createNamedQuery("GameModel.findReference", GameModel.class);
            query.setParameter("id", gm.getId());
            return query.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    /**
     * Same as {@link remove(java.lang.Long) } but within a brand new transaction
     *
     * @param gameModelId id of the gameModel to remove
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public void removeTX(Long gameModelId) {
        logger.info("Remove GameModel #{}", gameModelId);
        this.remove(gameModelId);
        logger.info("  done");
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
            if (gameModel.isModel() && instantiation.isReference()) {
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

        if (entity.isModel()) {
            for (GameModel gm : getImplementations(entity)) {
                if (gm.isScenario() && !gm.getStatus().equals(Status.DELETE)) {
                    throw WegasErrorMessage.error("Unable to delete the model because at least one scenario still depends on it");
                }
            }
        }

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
    public List<GameModel> findByTypeAndStatus(final GmType gmType, final GameModel.Status status) {
        final TypedQuery<GameModel> query = getEntityManager().createNamedQuery("GameModel.findByTypeAndStatus", GameModel.class);
        query.setParameter("type", gmType);
        query.setParameter("status", status);
        return query.getResultList();
    }

    /**
     * Find all gameModels by type and status.
     *
     * @param gmTypes  gameModels must match one of the given types
     * @param statuses gameModels must match one of the given statuses
     *
     * @return all gameModel matching the given status
     */
    public List<GameModel> findByTypesAndStatuses(List<GmType> gmTypes,
        final List<GameModel.Status> statuses) {

        final TypedQuery<GameModel> query = getEntityManager().createNamedQuery("GameModel.findByTypesAndStatuses", GameModel.class);
        query.setParameter("types", gmTypes);
        query.setParameter("statuses", statuses);
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
    @Override
    public void reset(final Long gameModelId) {
        this.reset(this.find(gameModelId));
    }

    /**
     * @param gameModel
     */
    @Override
    public void reset(final GameModel gameModel) {
        // Need to flush so prepersit events will be thrown (for example Game will add default teams)
        ///getEntityManager().flush();
        //gameModel.propagateGameModel();  -> propagation is now done automatically after descriptor creation
        this.propagateAndReviveDefaultInstances(gameModel, gameModel, false); // reset the whole gameModel
        // speed-up scenario restart but may miss some transitions triggerd by default values
        //requestManager.migrateUpdateEntities();
        stateMachineFacade.runStateMachines(gameModel, true);

        /* clear .user-uploads this special directory contains files uploaded by players. Hence, it
         * has to be erase on restart
         */
        jcrFacade.deleteUserUploads(gameModel);
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

    /**
     * Someone can ask GameModelController#LiveEdition/ to inform a given audience such an entity is
     * being edited. Thus, others users may display the new entity before it is fully flushed in
     * database. client may also prevent users to edit this entity (prevent co-edition)
     */
    public void liveUpdate(String channel, AbstractEntity entity) {
        websocketFacade.sendLiveUpdate(channel, entity.getClass().getSimpleName() + "_" + entity.getId(), entity, requestManager.getSocketId());
    }

    /**
     * Find all gameModel matching the given type and the given status the current user has access
     * too.
     *
     * @param type
     * @param status
     *
     * @return
     */
    public Collection<GameModel> findByTypeStatusAndUser(GmType type,
        GameModel.Status status) {
        ArrayList<GameModel> gameModels = new ArrayList<>();

        Map<Long, List<String>> pMatrix = this.getPermissionMatrix(type, status);

        for (Map.Entry<Long, List<String>> entry : pMatrix.entrySet()) {
            Long id = entry.getKey();
            GameModel gm = this.find(id);
            if (gm != null && gm.getType() == type && gm.getStatus() == status) {
                gameModels.add(gm);
            }
        }

        return gameModels;
    }

    /**
     * Get the list of gameModels id the current user has access to.
     *
     * @param type   restrict to this kind of gameModel
     * @param status restrict to gameModel with such a status
     *
     * @return list of gameModel id mapped with the permission the user has
     */
    public Map<Long, List<String>> getPermissionMatrix(GmType type,
        GameModel.Status status) {

        List<GmType> gmTypes = new ArrayList<>();
        List<GameModel.Status> gmStatuses = new ArrayList<>();

        gmTypes.add(type);
        gmStatuses.add(status);

        return getPermissionMatrix(gmTypes, gmStatuses);
    }

    /**
     * Get the list of gameModels id the current user has access to.
     *
     * @param types    restrict to those kind of gameModel
     * @param statuses restrict to gameModel having one of these status
     *
     * @return list of gameModel id mapped with the permission the user has
     */
    public Map<Long, List<String>> getPermissionMatrix(List<GmType> types,
        List<GameModel.Status> statuses) {
        Map<Long, List<String>> pMatrix = new HashMap<>();

        String roleQuery = "SELECT p FROM Permission p WHERE "
            + "(p.role.id in "
            + "    (SELECT r.id FROM User u JOIN u.roles r WHERE u.id = :userId)"
            + ")";

        String userQuery = "SELECT p FROM Permission p WHERE p.user.id = :userId ";

        this.processQuery(userQuery, pMatrix, null, types, statuses, null);
        this.processQuery(roleQuery, pMatrix, null, types, statuses, null);

        return pMatrix;
    }

    public void processQuery(String sqlQuery, Map<Long, List<String>> gmMatrix, Map<Long, List<String>> gMatrix, List<GmType> gmTypes, List<GameModel.Status> gmStatuses, List<Game.Status> gStatuses) {
        TypedQuery<Permission> query = this.getEntityManager().createQuery(sqlQuery, Permission.class);
        User user = userFacade.getCurrentUser();
        query.setParameter("userId", user.getId());
        List<Permission> resultList = query.getResultList();

        for (Permission p : resultList) {
            processPermission(p.getValue(), gmMatrix, gMatrix, gmTypes, gmStatuses, gStatuses);
        }
    }

    private void processPermission(String permission, Map<Long, List<String>> gmMatrix,
        Map<Long, List<String>> gMatrix,
        List<GmType> gmTypes, List<GameModel.Status> gmStatuses,
        List<Game.Status> gStatuses) {
        if (permission != null && !permission.isEmpty()) {
            String[] split = permission.split(":");
            if (split.length == 3) {
                String type = null;
                String idPrefix = null;
                Map<Long, List<String>> pMatrix;

                if (split[0].equals("GameModel") && gmStatuses != null && gmTypes != null) {
                    type = "GameModel";
                    idPrefix = "gm";
                    pMatrix = gmMatrix;
                } else if (split[0].equals("Game") && gStatuses != null) {
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
                            for (GameModel gm : this.findByTypesAndStatuses(gmTypes, gmStatuses)) {
                                ids.add(gm.getId());
                            }
                        } else { //ie Game
                            for (Game g : gameFacade.findAll(gStatuses)) {
                                ids.add(g.getId());
                            }
                        }
                    } else {
                        Long id = Long.parseLong(pId.replace(idPrefix, ""));
                        ids.add(id);
                        if (type.equals("GameModel")) {
                            GameModel gm = this.find(id);
                            if (gm == null
                                || !gmTypes.contains(gm.getType())
                                || !gmStatuses.contains(gm.getStatus())) {
                                return;
                            }
                        } else {
                            Game game = gameFacade.find(id);
                            if (game == null || !gStatuses.contains(game.getStatus())) {
                                return;
                            }
                        }
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

    public Set<Long> findMatchingDescriptorIds(Long gameModelId, String criteria) {
        List<String> criterias = new ArrayList<>();
        criterias.add(criteria);
        return this.findMatchingDescriptorIds(gameModelId, criterias);
    }

    public Set<Long> findMatchingDescriptorIds(Long gameModelId, List<String> criterias) {
        GameModel gameModel = this.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        Set<Long> matches = new HashSet<>();

        MergeHelper.visitMergeable(gameModel, Boolean.TRUE, new MergeHelper.MergeableVisitor() {
            @Override
            public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
                return true;
            }

            @Override
            public void visitProperty(Object target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Object key, Object[] references) {
                if (field != null && field.getAnnotation() != null && field.getAnnotation().searchable()) {
                    VariableDescriptor vd = null;
                    for (Mergeable ancestor : ancestors) {
                        if (ancestor instanceof VariableDescriptor) {
                            vd = (VariableDescriptor) ancestor;
                            break;
                        }
                    }
                    if (vd != null && !matches.contains(vd.getId())) {
                        String text = null;

                        if (target instanceof Translation) {
                            text = ((Translation) target).getTranslation();
                        } else if (target != null) {
                            text = target.toString();
                        }

                        if (text != null && Helper.insensitiveContainsAll(text, criterias)) {
                            matches.add(vd.getId());
                        }
                    }
                }
            }
        });

        return matches;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public final void nop(Object payload) {
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

    public String findAndReplace(GameModel mergeable, FindAndReplacePayload payload) {

        FindAndReplaceVisitor replacer = new FindAndReplaceVisitor(payload);

        if (payload.getProcessVariables()) {
            if (payload.getRoots() != null && !payload.getRoots().isEmpty()) {
                for (String variableName : payload.getRoots()) {
                    try {
                        VariableDescriptor variable = variableDescriptorFacade.find(mergeable, variableName);
                        MergeHelper.visitMergeable(variable, Boolean.TRUE, replacer);
                    } catch (WegasNoResultException ex) {
                        throw WegasErrorMessage.error("Variable \"" + variableName + "\" not found");
                    }
                }
            } else {
                MergeHelper.visitMergeable(mergeable, Boolean.TRUE, replacer);
            }
        }

        if (payload.getProcessPages()) {
            replacer.processPages(mergeable);
        }

        if (payload.getProcessScripts()) {
            replacer.processScripts(mergeable);
        }

        if (payload.getProcessStyles()) {
            replacer.processStyles(mergeable);
        }

        replacer.propagate(mergeable, websocketFacade);
        return replacer.getOutput();
    }

    public String findAndReplace(Long gameModelId, FindAndReplacePayload payload) {
        return this.findAndReplace(this.find(gameModelId), payload);
    }

    /**
     * Find all quest defined in achievements of the given project
     *
     * @param gameModelId if of the gameModel
     *
     * @return set of quest name
     */
    public Set<String> findAllQuests(Long gameModelId) {
        TypedQuery<String> query = this.getEntityManager().createNamedQuery("Achievement.findDistinctQuests", String.class);
        query.setParameter("gameModelId", gameModelId);

        HashSet set = new HashSet();
        set.addAll(query.getResultList());
        return set;
    }

    public Set<String> findAllFiredEvents(Long gameModelId) {
        return this.findAllFiredEvents(this.find(gameModelId));
    }

    public Set<String> findAllFiredEvents(GameModel gameModel) {
        FindAndReplacePayload payload = new FindAndReplacePayload();

        payload.setLangsFromGameModel(gameModel);

        payload.setProcessVariables(true);
        payload.setProcessPages(true);
        payload.setProcessScripts(true);
        payload.setProcessStyles(false);

        payload.setRegex(true);
        // match : Event.fire("eventName"), Event.fire(\"event\") + Event.fired
        payload.setFind("Event.fire\\(\\\\?\"([^\"\\\\]+)\\\\?\"\\)|Event.fired\\(\\\\?\"([^\"\\\\]+)\\\\?\"\\)");

        RegexExtractorVisitor extractor = new RegexExtractorVisitor(payload, variableDescriptorFacade);
        List<List<String>> process = extractor.process(gameModel);

        Set<String> events = new HashSet<>();

        for (List<String> line : process) {
            events.addAll(line);
        }
        return events;
    }

    public Set<String> findAllRefToFiles(Long gameModelId, Long vdId) {
        GameModel gm = this.find(gameModelId);
        VariableDescriptor variable = null;

        if (vdId != null) {
            variable = variableDescriptorFacade.find(vdId);
        }
        return this.findAllRefToFiles(gm, variable);
    }

    /**
     * Go through the givenGameModel variables and fetch each references to internal files
     *
     * @param gameModel the gamemodel to search for reference in
     * @param root      Optional variable to search in, if null, search the whole gameModel
     *
     * @return
     */
    public Set<String> findAllRefToFiles(GameModel gameModel,
        VariableDescriptor root) {
        FindAndReplacePayload payload = new FindAndReplacePayload();

        payload.setLangsFromGameModel(gameModel);

        payload.setProcessVariables(true);
        payload.setProcessPages(false);
        payload.setProcessScripts(false);
        payload.setProcessStyles(false);

        if (root != null) {
            List<String> roots = new ArrayList<>();
            roots.add(root.getName());
            payload.setRoots(roots);
        }

        payload.setRegex(true);
        // match : Event.fire("eventName"), Event.fire(\"event\") + Event.fired
        payload.setFind("data-file=\\\\?\"([^\"\\\\]+)\\\\?\"");

        RegexExtractorVisitor extractor = new RegexExtractorVisitor(payload, variableDescriptorFacade);
        List<List<String>> process = extractor.process(gameModel);

        Set<String> events = new HashSet<>();

        for (List<String> line : process) {
            events.addAll(line);
        }
        return events;
    }

    /**
     * Find all users with a scenarist access
     *
     * @param gameModel
     *
     * @return
     */
    public List<User> findScenarists(Long id) {
        TypedQuery<User> query = this.getEntityManager().createNamedQuery("User.findByTransitivePermission", User.class);
        query.setParameter(1, "%:gm" + id);
        return query.getResultList();
    }

    /**
     * Get all permissions related to a gameModel
     *
     * @param gmId
     *
     * @return
     */
    public List<Permission> getPermissions(Long gmId) {
        TypedQuery<Permission> query = this.getEntityManager().createNamedQuery("GameModel.findByPermission", Permission.class);
        query.setParameter("permission", "%:gm" + gmId);
        return query.getResultList();
    }
}
