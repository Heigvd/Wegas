/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.ModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.cron.EjbTimerFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.content.ContentConnector.WorkspaceType;
import com.wegas.core.jcr.helpers.PatchUtils;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.merge.patch.WegasEntityPatch;
import com.wegas.core.merge.patch.WegasPatch.PatchDiff;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModel.Status;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.pagination.Page;
import com.wegas.core.rest.util.pagination.Pageable;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.tools.FindAndReplacePayload;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.zip.ZipInputStream;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import javax.jcr.RepositoryException;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import org.apache.commons.text.StringEscapeUtils;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel")
@Produces(MediaType.APPLICATION_JSON)
public class GameModelController {

    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;

    /**
     *
     */
    @Inject
    private ModelFacade modelFacade;

    @Inject
    private PlayerFacade playerFacade;

    /**
     *
     */
    @Inject
    private RequestManager requestManager;

    /**
     *
     */
    @Inject
    private EjbTimerFacade ejbTimerFacade;

    @Inject
    private JCRConnectorProvider jcrConnectorProvider;

    /**
     *
     * @param gm
     *
     * @return the new game model
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public GameModel create(GameModel gm) {
        gameModelFacade.createWithDebugGame(gm);

        return gm;
    }

    private List<Long> getIdsFromString(String ids) {
        List<Long> scenarioIds = new ArrayList<>();

        for (String id : ids.split(",")) {
            scenarioIds.add(Long.parseLong(id));
        }

        return scenarioIds;
    }

    /**
     * Create a model
     *
     * @param ids      comma separated list of newVersion id to base the new model on
     * @param template
     *
     * @return a brand new model, not yet propagated
     *
     * @throws IOException
     */
    @POST
    @Path("extractModel/{ids}")
    public GameModel createModel(@PathParam("ids") String ids, GameModel template) throws IOException {

        GameModel model = modelFacade.createModelFromCommonContentFromIds(template.getName(), getIdsFromString(ids));

        return model;
    }

    /**
     * compare variable and send CSV file
     *
     * @param ids
     */
    @GET
    @Path("Compare/{ids}")
    public Response compare(@PathParam("ids") String ids) {

        List<Long> idList = getIdsFromString(ids);
        Map<String, List<Long>> matrix = modelFacade.getVariableMatrixFromIds(idList);

        StringBuilder sb = new StringBuilder();
        sb.append("Var, all ");
        idList.stream().forEach(id -> sb.append(",").append(id));
        sb.append(System.lineSeparator());

        matrix.forEach((varName, list) -> {
            sb.append(StringEscapeUtils.escapeCsv(varName));
            if (list.size() == idList.size()) {
                sb.append(", x");
            } else {
                sb.append(',');
                idList.stream().forEach(id -> sb.append(",").append(list.contains(id) ? "x" : ""));
            }
            sb.append(System.lineSeparator());
        });

        return Response.ok(sb.toString(), "text/csv")
            .header("Content-Disposition", "attachment; filename="
                + "variables.csv").build();
    }

    @GET
    @Path("{modelId: [1-9][0-9]*}/Integrate/{scenarioId: [1-9][0-9]*}")
    public GameModel integrate(@PathParam("modelId") Long modelId,
        @PathParam("scenarioId") Long scenarioId) throws IOException, RepositoryException {

        GameModel model = gameModelFacade.find(modelId);
        GameModel scenario = gameModelFacade.find(scenarioId);

        ArrayList<GameModel> scenarios = new ArrayList<>(1);
        scenarios.add(scenario);
        modelFacade.integrateScenario(model, scenarios);

        return gameModelFacade.find(model.getId());
    }

    @GET
    @Path("{modelId: [1-9][0-9]*}/Diff")
    public PatchDiff diff(@PathParam("modelId") Long modelId) throws IOException, RepositoryException {

        GameModel model = gameModelFacade.find(modelId);

        GameModel reference = modelFacade.getReference(model);

        WegasEntityPatch diff = new WegasEntityPatch(reference, model, true);

        return diff.diff();
    }

    @GET
    @Path("Release/{scenarioId: [1-9][0-9]*}")
    public GameModel release(@PathParam("scenarioId") Long scenarioId) throws IOException, RepositoryException {
        return modelFacade.releaeScenario(scenarioId);
    }

    /**
     * Create a model
     *
     * @param modelId model to propagate
     *
     * @return the model
     *
     * @throws java.io.IOException
     *
     */
    @PUT
    @Path("{modelId : [1-9][0-9]*}/Propagate")
    public GameModel propagateModel(@PathParam("modelId") Long modelId) throws IOException, RepositoryException {
        return modelFacade.propagateModel(modelId);
    }

    @GET
    @Path("{modelId : [1-9][0-9]*}/FixVariableTree")
    public void fixTree(@PathParam("modelId") Long modelId) throws IOException, RepositoryException {
        modelFacade.fixVariableTree(modelId);
    }

    /**
     *
     * Duplicate model
     *
     * @param templateGameModelId id of the newVersion to duplicate
     * @param gm                  template to fetch the new name in
     *
     * @return the new game model
     */
    @POST
    @Path("model/{templateGameModelId : [1-9][0-9]*}")
    public GameModel templateCreateModel(@PathParam("templateGameModelId") Long templateGameModelId, GameModel gm) throws CloneNotSupportedException {
        // logger.info(Level.INFO, "POST GameModel");

        GameModel duplicate = gameModelFacade.createModelWithDebugGame(templateGameModelId);
        // restore original name
        duplicate.setName(gm.getName());

        return duplicate;
    }

    /**
     *
     * Duplicate and set new newVersion name
     *
     * @param templateGameModelId id of the newVersion to duplicate
     * @param gm                  template to fetch the new name in
     *
     * @return the new game model
     */
    @POST
    @Path("{templateGameModelId : [1-9][0-9]*}")
    public GameModel templateCreate(@PathParam("templateGameModelId") Long templateGameModelId, GameModel gm) throws CloneNotSupportedException {
        // logger.info(Level.INFO, "POST GameModel");

        GameModel duplicate = gameModelFacade.createScenarioWithDebugGame(templateGameModelId);
        // restore original name
        duplicate.setName(gm.getName());

        return duplicate;
    }

    /**
     * Add a test player in the gameModel. The gamemodel must be a scenario or a model. A debug Game
     * must exist. A debugTesm must exist
     *
     * @param gameModelId id of the gameModelId to add a testPlayer within
     *
     * @return the brand new test player
     */
    @POST
    @Path("{gameModelId : [1-9][0-9]*}/ExtraTestPlayer")
    public Player templateCreate(@PathParam("gameModelId") Long gameModelId) {
        return gameModelFacade.addTestPlayer(gameModelId);
    }

    /**
     * EXPERIMENTAL
     * <p>
     * update default instance based on given player ones
     *
     * @param templateGameModelId
     * @param playerId
     *
     * @return up to date reseted gamemodel
     *
     * @throws IOException
     */
    @POST
    @Path("{templateGameModelId : [1-9][0-9]*}/UpdateFromPlayer/{playerId: [1-9][0-9]*}")
    public GameModel updateFromPlayer(@PathParam("templateGameModelId") Long templateGameModelId,
        @PathParam("playerId") Long playerId) throws IOException {

        GameModel gm = gameModelFacade.setDefaultInstancesFromPlayer(templateGameModelId, playerId);
        gameModelFacade.reset(gm);

        return gm;
    }

    /**
     * EXPERIMENTAL & BUGGY
     * <p>
     * Create a new newVersion based on given player instances status (new newVersion default
     * instance fetch from player ones)
     * <p>
     * This one is Buggy since several instances merge are not cross-newVersion compliant
     *
     * @param templateGameModelId
     * @param playerId
     *
     * @return the new newVersion
     *
     * @throws IOException
     */
    @POST
    @Path("{templateGameModelId : [1-9][0-9]*}/CreateFromPlayer/{playerId: [1-9][0-9]*}")
    public GameModel createFromPlayer(@PathParam("templateGameModelId") Long templateGameModelId,
        @PathParam("playerId") Long playerId) throws IOException {

        GameModel duplicate = gameModelFacade.createFromPlayer(templateGameModelId, playerId);

        return duplicate;
    }

    /**
     *
     * @param file
     * @param details
     *
     * @return the new uploaded newVersion
     *
     * @throws IOException
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public GameModel upload(@FormDataParam("file") InputStream file,
        @FormDataParam("file") FormDataBodyPart details) throws IOException, RepositoryException {

        GameModel gameModel;

        if (details.getMediaType().equals(MediaType.APPLICATION_JSON_TYPE)) {
            gameModel = JacksonMapperProvider.getMapper().readValue(file, GameModel.class);
            gameModel.setName(gameModelFacade.findUniqueName(gameModel.getName(), GameModel.GmType.SCENARIO));
            gameModel.setType(GameModel.GmType.SCENARIO);
            gameModelFacade.createWithDebugGame(gameModel);
            return gameModel;
        } else if (details.getContentDisposition().getFileName().endsWith(".wgz")) {
            try ( ZipInputStream zip = new ZipInputStream(file, StandardCharsets.UTF_8)) {
                return gameModelFacade.createFromWgz(zip);
            }
        } else if (details.getContentDisposition().getFileName().endsWith(".zip")) {
            // create from
            throw new WegasIncompatibleType("Not Yet implemented");
        } else {
            throw new WegasIncompatibleType("Unknown file type");
        }
    }

    @PUT
    @Path("{gameModelId: [1-9][0-9]*}/Patch")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public GameModel patch(@PathParam("gameModelId") Long gameModelId,
        @FormDataParam("file") InputStream file,
        @FormDataParam("file") FormDataBodyPart details) throws IOException, RepositoryException {

        GameModel gameModel = gameModelFacade.find(gameModelId);

        if (details.getMediaType().equals(MediaType.APPLICATION_JSON_TYPE)) {
            GameModel newVersion = JacksonMapperProvider.getMapper().readValue(file, GameModel.class);
            if (newVersion != null) {
                return gameModelFacade.patch(gameModel, newVersion);
            }
        } else if (details.getContentDisposition().getFileName().endsWith(".wgz")) {
            try ( ZipInputStream zip = new ZipInputStream(file, StandardCharsets.UTF_8)) {
                GameModel newVersion = gameModelFacade.extractGameModelFromWGZ(zip);
                if (newVersion != null) {
                    return gameModelFacade.patch(gameModel, newVersion);
                }
            }
        } else if (details.getContentDisposition().getFileName().endsWith(".zip")) {
            try ( ZipInputStream zip = new ZipInputStream(file, StandardCharsets.UTF_8)) {
                GameModelFacade.RecombinedGameModel combined = gameModelFacade.extractFromExplodedZip(zip);
                GameModel newVersion = combined.getGameModel();

                if (newVersion != null) {
                    // // clear libs name to allow renaming them
                    // gameModel.getGameModel().getLibraries().forEach(lib -> lib.setContentKey(null));
                    gameModel = gameModelFacade.patch(gameModel, newVersion);
                    ContentConnector connector = jcrConnectorProvider.getContentConnector(gameModel, WorkspaceType.FILES);
                    PatchUtils.doPatch(combined, gameModel, connector);
                    return gameModel;
                }
            }
        }

        throw WegasErrorMessage.error("Nothing to patch...");
    }

    @PUT
    @Path("{gameModelId: [1-9][0-9]*}/PatchDiff")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public PatchDiff patchDiff(@PathParam("gameModelId") Long gameModelId,
        @FormDataParam("file") InputStream file,
        @FormDataParam("file") FormDataBodyPart details) throws IOException, RepositoryException {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        GameModel newVersion = null;
        PatchDiff filesDiff = null;

        if (details.getMediaType().equals(MediaType.APPLICATION_JSON_TYPE)) {
            newVersion = JacksonMapperProvider.getMapper().readValue(file, GameModel.class);
        } else if (details.getContentDisposition().getFileName().endsWith(".wgz")) {
            try ( ZipInputStream zip = new ZipInputStream(file, StandardCharsets.UTF_8)) {
                newVersion = gameModelFacade.extractGameModelFromWGZ(zip);
            }
        } else if (details.getContentDisposition().getFileName().endsWith(".zip")) {
            try ( ZipInputStream zip = new ZipInputStream(file, StandardCharsets.UTF_8)) {
                GameModelFacade.RecombinedGameModel combined = gameModelFacade.extractFromExplodedZip(zip);
                newVersion = combined.getGameModel();
                ContentConnector connector = jcrConnectorProvider.getContentConnector(gameModel, WorkspaceType.FILES);
                filesDiff = PatchUtils.getFilesDiff(combined, connector);
            }
        }

        if (newVersion != null) {
            // preserve name and comments
            newVersion.setComments(gameModel.getComments());
            newVersion.setName(gameModel.getName());

            WegasEntityPatch diff = new WegasEntityPatch(gameModel, newVersion, true);
            PatchDiff gmDiff = diff.diffForce();
            List<PatchDiff> list = new ArrayList<>();
            if (gmDiff != null) {
                list.add(gmDiff);
            }
            if (filesDiff != null) {
                list.add(filesDiff);
            }
            if (!list.isEmpty()) {
                return new WegasEntityPatch.DiffCollection("GameModel", list);
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * @param gameModelId
     *
     * @return ZIP export which contains the game model and its files
     *
     */
    @GET
    @Path("{gameModelId : [1-9][0-9]*}.wgz")
    public Response exportZIP(@PathParam("gameModelId") Long gameModelId) throws RepositoryException, UnsupportedEncodingException {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        StreamingOutput output = gameModelFacade.archiveAsWGZ(gameModelId);
        String filename = URLEncoder.encode(gameModelFacade.find(gameModelId).getName().replaceAll("\\" + "s+", "_") + ".wgz", StandardCharsets.UTF_8.displayName());

        return Response.ok(output, "application/zip").
            header("content-disposition",
                "attachment; filename="
                + filename).build();
    }

    /**
     * @param gameModelId
     *
     * @return ZIP export which contains the game model and its files
     *
     */
    @GET
    @Path("{gameModelId : [1-9][0-9]*}.zip")
    public Response exportExplodedZIP(@PathParam("gameModelId") Long gameModelId) throws RepositoryException, UnsupportedEncodingException, CloneNotSupportedException {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        StreamingOutput output = gameModelFacade.archiveAsExplodedZip(gameModelId);
        String filename = URLEncoder.encode(gameModelFacade.find(gameModelId).getName().replaceAll("\\" + "s+", "_") + ".zip", StandardCharsets.UTF_8.displayName());

        return Response.ok(output, "application/zip").
            header("content-disposition",
                "attachment; filename="
                + filename).build();
    }

    /**
     *
     * @param entityId
     *
     * @return the requested GameModel
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON + "; charset=utf-8") // @hack force utf-8 charset
    @Path("{entityId : [1-9][0-9]*}")
    public GameModel get(@PathParam("entityId") Long entityId) {
        return gameModelFacade.find(entityId);
    }

    @GET
    @Path("ByIds/{ids}")
    public List<GameModel> getByIds(@PathParam("ids") String ids) {
        return getIdsFromString(ids).stream().map(id -> gameModelFacade.find(id)).collect(Collectors.toList());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON + "; charset=utf-8") // @hack force utf-8 charset
    @Path("{entityId : [1-9][0-9]*}/{filename: .*\\.json}")
    public Response downloadJSON(@PathParam("entityId") Long entityId, @PathParam("filename") String filename) throws UnsupportedEncodingException {
        return Response.ok(this.get(entityId))
            .header("Content-Disposition", "attachment; filename=" + URLEncoder.encode(filename, StandardCharsets.UTF_8.displayName())).build();
    }

    /**
     *
     * @param entityId
     * @param entity
     *
     * @return up to date gameModel
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public GameModel update(@PathParam("entityId") Long entityId, GameModel entity) {
        return gameModelFacade.update(entityId, entity);
    }

    /**
     * Duplicate as-is
     *
     * @param entityId
     *
     * @return game model Copy
     *
     */
    @POST
    @Path("{entityId: [1-9][0-9]*}/Duplicate")
    public GameModel duplicate(@PathParam("entityId") Long entityId) throws CloneNotSupportedException {
        return gameModelFacade.duplicateGameModel(entityId);
    }

    /**
     *
     * @return all gameModel the current user can see
     */
    @GET
    public Collection<GameModel> index() {
        return findByStatus(GameModel.Status.LIVE);
    }

    /**
     * Update gameModel status (bin, live, etc)(
     *
     * @param entityId
     * @param status
     *
     * @return the game model with up to date status
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}/status/{status: [A-Z]*}")
    public GameModel changeStatus(@PathParam("entityId") Long entityId, @PathParam("status") final GameModel.Status status) {
        GameModel gm = gameModelFacade.find(entityId);
        switch (status) {
            case LIVE:
                if (requestManager.canRestoreGameModel(gm)) {
                    gameModelFacade.live(gm);
                }
                break;
            case BIN:
                if (requestManager.canDeleteGameModel(gm)) {
                    gameModelFacade.bin(gm);
                }
                break;
            case DELETE:
                if (requestManager.canDeleteGameModel(gm)) {
                    gameModelFacade.delete(gm);
                }
                break;
            case SUPPRESSED:
                // nothing to do since this status does not exists
                break;
        }
        return gm;
    }

    /**
     * Get GameModel permission matrix
     *
     * @param status
     *
     */
    @GET
    @Path("permissions/{type: [A-Z]*}/status/{status: [A-Z]*}")
    public Map<Long, List<String>> getPermissionsMatrix(@PathParam("status") final GameModel.Status status,
        @PathParam("type") final GameModel.GmType type) {
        return gameModelFacade.getPermissionMatrix(type, status);
    }

    /**
     * Get all gameModel with given status
     *
     * @param status
     *
     * @return all gameModels with given status the user has access too
     */
    @GET
    @Path("status/{status: [A-Z]*}")
    public Collection<GameModel> findByStatus(@PathParam("status") final GameModel.Status status) {
        return gameModelFacade.findByTypeStatusAndUser(GameModel.GmType.SCENARIO, status);
    }

    /**
     *
     * Get all gameModel of given type with given status
     *
     * @param type
     * @param status
     *
     * @return all gameModels of type with given status the user has access too
     */
    @GET
    @Path("type/{type: [A-Z]*}/status/{status: [A-Z]*}")
    public Collection<GameModel> findByTypeAndStatus(
        @PathParam("type") final GameModel.GmType type,
        @PathParam("status") final GameModel.Status status) {
        return gameModelFacade.findByTypeStatusAndUser(type, status);
    }

    /**
     *
     * Get all gameModel of given type with given status paginated
     *
     * @param type
     * @param status
     * @param mine
     * @param page
     * @param size
     * @param query
     * @return given size of gameModel having type, status and matching query
     */
    @GET
    @Path("type/{type: [A-Z]*}/status/{status: [A-Z]*}/Paginated")
    public Page<GameModel> paginatedGameModels(
            @PathParam("type") final GameModel.GmType type,
            @PathParam("status") final GameModel.Status status,
            @QueryParam("mine") boolean mine,
            @QueryParam("page") int page,
            @QueryParam("size") int size,
            @QueryParam("query") String query) {
        return gameModelFacade.findByTypeStatusAndUserPaginated(type, status, mine, new Pageable(page, size, query));
    }

    /**
     * count gameModel with given status
     *
     * @param status
     *
     * @return the number of gameModel with the given status the current user has access too
     */
    @GET
    @Path("status/{status: [A-Z]*}/count")
    public int countByStatus(@PathParam("status") final GameModel.Status status) {
        return this.findByStatus(status).size();
    }

    /**
     * count gameModel with given status
     *
     * @param type
     * @param status
     *
     * @return the number of gameModel with the given status the current user has access too
     */
    @GET
    @Path("type/{type: [A-Z]*}/status/{status: [A-Z]*}/count")
    public int countByTypeAndStatus(
        @PathParam("type") final GameModel.GmType type,
        @PathParam("status") final GameModel.Status status) {
        return this.findByTypeAndStatus(type, status).size();
    }

    /**
     * Move to bin a LIVE gameModel, Delete a bin one
     *
     * @param entityId
     *
     * @return the just movedToBin/deleted gameModel
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    public GameModel delete(@PathParam("entityId") Long entityId) {
        SecurityUtils.getSubject().checkPermission("GameModel:Delete:gm" + entityId);
        GameModel entity = gameModelFacade.find(entityId);
        if (entity.getStatus() == GameModel.Status.LIVE) {
            gameModelFacade.bin(entity);
        } else if (entity.getStatus() == GameModel.Status.BIN) {
            gameModelFacade.delete(entity);
        }
        // gameModelFacade.asyncRemove(entityId);
        return entity;
    }

    /**
     * Delete all gameModel the current user has access too (set status = delete)
     *
     * @return all deleted gameModel
     */
    @DELETE
    public Collection<GameModel> deleteAll() {
        Collection<GameModel> games = new ArrayList<>();
        for (GameModel gm : gameModelFacade.findByTypeAndStatus(GameModel.GmType.SCENARIO, GameModel.Status.BIN)) {
            if (requestManager.canDeleteGameModel(gm)) {
                gameModelFacade.delete(gm);
                games.add(gm);
            }
        }
        return games;
    }

    @DELETE
    @Path("Force/{entityId: [1-9][0-9]*}")
    @RequiresRoles("Administrator")
    public void finalDelete(@PathParam("entityId") Long entityId) {
        GameModel gm = gameModelFacade.find(entityId);
        if (gm.getStatus().equals(Status.DELETE)) {
            gameModelFacade.remove(entityId);
        }
    }

    @DELETE
    @Path("CleanDatabase")
    @RequiresRoles("Administrator")
    public void deleteForceAll() {
        ejbTimerFacade.removeGameModels();
    }

    @POST
    @Path("{gameModelId: [1-9][0-9]*}/FindAndReplace")
    public String findAndReplace(@PathParam("gameModelId") Long gameModelId,
        FindAndReplacePayload payload) {
        return gameModelFacade.findAndReplace(gameModelId, payload);
    }

    @GET
    @Path("{gameModelId: [1-9][0-9]*}/FindAllFiredEvents")
    public Set<String> findFiredEvents(@PathParam("gameModelId") Long gameModelId) {
        return gameModelFacade.findAllFiredEvents(gameModelId);
    }

    /**
     * Find all quest defined in achievements of the given project
     *
     * @param gameModelId if of the gameModel
     *
     * @return set of quest name
     */
    @GET
    @Path("{gameModelId: [1-9][0-9]*}/FindAllQuests")
    public Set<String> findAllQuests(@PathParam("gameModelId") Long gameModelId) {
        return gameModelFacade.findAllQuests(gameModelId);
    }

    @GET
    @Path("{gameModelId: [1-9][0-9]*}/FindAllRefToFiles/{variableId: ([1-9][0-9]*)?}")
    public Set<String> findRefToFiles(
        @PathParam("gameModelId") Long gameModelId,
        @PathParam("variableId") Long vdId) {
        return gameModelFacade.findAllRefToFiles(gameModelId, vdId);
    }

    @GET
    @Path("{gameModelId: [1-9][0-9]*}/TestPlayer")
    public Player getTestPlayer(
        @PathParam("gameModelId") Long gameModelId
    ) {
        if (gameModelId != null) {
            return playerFacade.findDebugPlayerByGameModelId(gameModelId);
        }
        return null;
    }

    @POST
    @Path("LiveEdition/{channel}")
    public void propagateLiveEdition(@PathParam("channel") String channel, AbstractEntity entity) {
        gameModelFacade.liveUpdate(channel, entity);
    }

    /**
     * Get all permission linked to a gameModel
     *
     * @param gmId
     *
     * @return list of permission
     */
    @GET
    @Path("Permissions/{gmId}")
    public List<Permission> getPermission(@PathParam("gmId") Long gmId) {
        return gameModelFacade.getPermissions(gmId);
    }
}
