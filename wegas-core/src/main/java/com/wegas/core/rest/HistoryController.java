/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.JCRFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.content.*;
import com.wegas.core.jcr.content.ContentConnector.WorkspaceType;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.ejb.UserFacade;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.ws.rs.*;
import javax.ws.rs.core.*;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("GameModel/{gameModelId : ([1-9][0-9]*)?}/History")
public class HistoryController {

    /**
     *
     */
    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(HistoryController.class);

    static final long CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private RequestManager requestManager;

    @Inject
    private UserFacade userFacade;

    @Inject
    private JCRFacade jcrFacade;

    /**
     * @param gameModelId
     *
     * @return list of directory content
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<AbstractContentDescriptor> listDirectory(@PathParam("gameModelId") Long gameModelId) {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        return jcrFacade.listDirectory(gameModel, ContentConnector.WorkspaceType.HISTORY, "/");
    }

    /**
     * @param gameModelId
     * @param absolutePath
     *
     * @return the destroyed element or HTTP not modified
     *
     * @throws WegasErrorMessage when deleting a non empty directory without
     *                           force=true
     */
    @DELETE
    @Path("{absolutePath : .*?}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object delete(@PathParam("gameModelId") Long gameModelId,
            @PathParam("absolutePath") String absolutePath) {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        return jcrFacade.delete(gameModel, ContentConnector.WorkspaceType.HISTORY, absolutePath, "true");
    }

    /**
     *
     * @param gameModelId
     *
     * @throws RepositoryException
     * @throws IOException
     */
    @POST
    @Path("/CreateVersion")
    public void createVersion(@PathParam("gameModelId") Long gameModelId) throws RepositoryException, IOException {
        String name = new SimpleDateFormat("yyyy.MM.dd HH.mm.ss").format(new Date())
                + " by " + userFacade.getCurrentUser().getName();

        this.createVersion(gameModelId, name);
    }

    /**
     *
     * @param gameModelId
     * @param name
     *
     * @throws RepositoryException
     * @throws IOException
     */
    @POST
    @Path("CreateVersion/{version: .*}")
    public void createVersion(@PathParam("gameModelId") Long gameModelId,
            @PathParam("version") String name) throws RepositoryException, IOException {

        GameModel gameModel = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gameModel);

        if (!name.endsWith(".json")) {
            name = name + ".json";
        }

        jcrFacade.createFile(gameModel, ContentConnector.WorkspaceType.HISTORY, name, "/",
                "application/octet-stream", null, null,
                new ByteArrayInputStream(gameModelFacade.find(gameModelId).toJson(Views.Export.class).getBytes("UTF-8")), false);
    }

    /**
     * Create a new gameModel based on a JSON version
     *
     * @param gameModelId
     * @param path
     *
     * @return the restored gameModel
     *
     * @throws IOException
     */
    @GET
    @Path("Restore/{path: .*}")
    public GameModel restoreVersion(@PathParam("gameModelId") Long gameModelId,
            @PathParam("path") String path) throws IOException {

        return this.createFromVersion(gameModelId, path);
    }

    /**
     *
     * @param gameModelId
     * @param path
     *
     * @return the restored gameModel
     *
     * @throws IOException
     */
    @GET
    @Path("CreateFromVersion/{path: .*}")
    public GameModel createFromVersion(@PathParam("gameModelId") Long gameModelId,
            @PathParam("path") String path) throws IOException {

        GameModel original = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(original);

        // Retrieve file from content repository
        InputStream file = jcrFacade.getFile(original, WorkspaceType.HISTORY, path);

        // Retrieve a jackson mapper instance and deserialize file
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        GameModel gm = mapper.readValue(file, GameModel.class);

        // Find a unique name for this new gameModel
        gm.setName(gameModelFacade.findUniqueName(gm.getName(), gm.getType()));
        gameModelFacade.createWithDebugGame(gm);

        // TODO
        return gm;
    }
}
