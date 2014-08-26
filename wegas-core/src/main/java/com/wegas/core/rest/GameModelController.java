/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.sun.jersey.multipart.FormDataBodyPart;
import com.sun.jersey.multipart.FormDataParam;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.jcr.RepositoryException;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.codehaus.jackson.map.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel")
@Produces(MediaType.APPLICATION_JSON)
public class GameModelController {

    private static final Logger logger = LoggerFactory.getLogger(GameModelController.class);
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @EJB
    private FileController fileController;

    /**
     *
     * @param gm
     * @return
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public GameModel create(GameModel gm) {
        // logger.info(Level.INFO, "POST GameModel");
        SecurityUtils.getSubject().checkPermission("GameModel:Create");
        gameModelFacade.createWithDebugGame(gm);

        return gm;
    }

    /**
     *
     * @param templateGameModelId
     * @param gm
     * @return
     * @throws IOException
     */
    @POST
    @Path("{templateGameModelId : [1-9][0-9]*}")
    public GameModel templateCreate(@PathParam("templateGameModelId") Long templateGameModelId, GameModel gm) throws IOException {
        // logger.info(Level.INFO, "POST GameModel");

        SecurityUtils.getSubject().checkPermission("GameModel:Duplicate:gm" + templateGameModelId);
        GameModel duplicate = gameModelFacade.duplicate(templateGameModelId);
        duplicate.setName(gm.getName());
        gameModelFacade.addGame(duplicate, new DebugGame());
        //duplicate.merge(gm);

        return duplicate;
    }

    /**
     *
     * @param file
     * @param details
     * @return
     * @throws IOException
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public GameModel upload(@FormDataParam("file") InputStream file,
            @FormDataParam("file") FormDataBodyPart details) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Create");

        ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance
        GameModel gm = mapper.readValue(file, GameModel.class);                 // and deserialize file

        gm.setName(gameModelFacade.findUniqueName(gm.getName()));               // Find a unique name for this new game

        gameModelFacade.createWithDebugGame(gm);
        return gm;
    }

    /**
     *
     * @param entityId
     * @return
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public GameModel get(@PathParam("entityId") Long entityId) {

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + entityId);

        return gameModelFacade.find(entityId);
    }

    /**
     *
     * @param entityId
     * @param entity
     * @return
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public GameModel update(@PathParam("entityId") Long entityId, GameModel entity) {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + entityId);

        return gameModelFacade.update(entityId, entity);
    }

    /**
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    @POST
    @Path("{entityId: [1-9][0-9]*}/Duplicate")
    public GameModel duplicate(@PathParam("entityId") Long entityId) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Duplicate:gm" + entityId);

        return gameModelFacade.duplicateWithDebugGame(entityId);
    }

    /**
     *
     * @param entityId
     * @return
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    public GameModel delete(@PathParam("entityId") Long entityId) {

        SecurityUtils.getSubject().checkPermission("GameModel:Delete:gm" + entityId);

        GameModel entity = gameModelFacade.find(entityId);
        gameModelFacade.remove(entityId);
        return entity;
    }

    /**
     *
     * @return
     */
    @GET
    public Collection<GameModel> index() {
        Collection<GameModel> games = new ArrayList<>();
        Subject s = SecurityUtils.getSubject();
        //String r =  (requestManager.getView() == Views.Index.class) ? "View": "Edit";

        for (GameModel gm : gameModelFacade.findTemplateGameModels()) {
            //if (s.isPermitted("GameModel:" + r +":gm" + aGm.getId())) {
            if (s.isPermitted("GameModel:View:gm" + gm.getId())
                    || s.isPermitted("GameModel:Instantiate:gm" + gm.getId())
                    || s.isPermitted("GameModel:Duplicate:gm" + gm.getId())) {
                games.add(gm);
            }
        }
        return games;
    }

    /**
     *
     * @param gameModelId
     * @param path
     * @return
     * @throws IOException
     */
    @GET
    @Path("{gameModelId: [1-9][0-9]*}/Restore/{path: .*}")
    public GameModel restoreVersion(@PathParam("gameModelId") Long gameModelId,
            @PathParam("path") String path) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        InputStream file = fileController.getFile(gameModelId, path);           // Retrieve file from content repository

        ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance
        GameModel gm = mapper.readValue(file, GameModel.class);                 // and deserialize file

        gm.setName(gameModelFacade.findUniqueName(gm.getName()));               // Find a unique name for this new game

        gameModelFacade.createWithDebugGame(gm);
        return gm;
    }

    /**
     *
     * @param gameModelId
     * @param path
     * @return
     * @throws IOException
     */
    @GET
    @Path("{gameModelId: [1-9][0-9]*}/Create/{path: .*}")
    public GameModel createFromVersion(@PathParam("gameModelId") Long gameModelId,
            @PathParam("path") String path) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        InputStream file = fileController.getFile(gameModelId, path);           // Retrieve file from content repository

        ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance
        GameModel gm = mapper.readValue(file, GameModel.class);                 // and deserialize file

        gm.setName(gameModelFacade.findUniqueName(gm.getName()));               // Find a unique name for this new game

        gameModelFacade.createWithDebugGame(gm);
        return gm;
    }

    /**
     *
     * @param gameModelId
     * @param name
     * @throws RepositoryException
     * @throws IOException
     */
    @GET
    @Path("{gameModelId: [1-9][0-9]*}/CreateVersion/{version: .*}")
    public void createVersion(@PathParam("gameModelId") Long gameModelId,
            @PathParam("name") String name) throws RepositoryException, IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance
        String serialized = mapper.writerWithView(Views.Export.class).
                writeValueAsString(gameModelFacade.find(gameModelId));          // Serialize the entity

        if (!fileController.directoryExists(gameModelId, "/History")) {         // Create version folder if it does not exist
            fileController.createDirectory(gameModelId, "History", "/", null, null);
        }

        fileController.createFile(gameModelId, name + ".json", "/History",
                "application/octet-stream", null, null,
                new ByteArrayInputStream(serialized.getBytes("UTF-8")));        // Create a file containing the version
    }

    /**
     *
     * @param gameModelId
     * @throws RepositoryException
     * @throws IOException
     */
    @GET
    @Path("{gameModelId: [1-9][0-9]*}/CreateVersion")
    public void createVersion(@PathParam("gameModelId") Long gameModelId) throws RepositoryException, IOException {
        this.createVersion(gameModelId, new SimpleDateFormat("yyyy.MM.dd HH.mm.ss").format(new Date())
                + " by " + userFacade.getCurrentUser().getName());
    }
}
