/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.security.ejb.UserFacade;
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
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.ws.rs.core.Response;
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
     * @param gm
     * @return
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public GameModel create(GameModel gm) {
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

    @PUT
    @Path("{templateGameModelId : [1-9][0-9]*}/UpdateFromPlayer/{playerId: [1-9][0-9]*}")
    public GameModel updateFromPlayer(@PathParam("templateGameModelId") Long templateGameModelId,
        @PathParam("playerId") Long playerId) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + templateGameModelId);

        GameModel gm = gameModelFacade.setDefaultInstancesFromPlayer(templateGameModelId, playerId);
        gameModelFacade.reset(gm);

        return gm;
    }

    @POST
    @Path("{templateGameModelId : [1-9][0-9]*}/CreateFromPlayer/{playerId: [1-9][0-9]*}")
    public GameModel createFromPlayer(@PathParam("templateGameModelId") Long templateGameModelId,
        @PathParam("playerId") Long playerId) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Duplicate:gm" + templateGameModelId);
        GameModel duplicate = gameModelFacade.createFromPlayer(templateGameModelId, playerId);

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
    @Produces(MediaType.APPLICATION_JSON + "; charset=utf-8")                   // @hack force utf-8 charset
    @Path("{entityId : [1-9][0-9]*}")
    public GameModel get(@PathParam("entityId") Long entityId) {

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + entityId);

        return gameModelFacade.find(entityId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON + "; charset=utf-8")                   // @hack force utf-8 charset
    @Path("{entityId : [1-9][0-9]*}/{filename: .*}.json")                       // @hack allow to add a filename with *.json to have a nice file
    public Response downloadJSON(@PathParam("entityId") Long entityId, @PathParam("filename") String filename) {
        return Response.ok(this.get(entityId))
            .header("Content-Disposition", "attachment; filename=" + filename).build();
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
     * @return
     */
    @GET
    public Collection<GameModel> index() {
        Collection<GameModel> games = new ArrayList<>();
        Subject s = SecurityUtils.getSubject();
        //String r =  (requestManager.getView() == Views.Index.class) ? "View": "Edit";

        for (GameModel gm : gameModelFacade.findTemplateGameModelsByStatus(GameModel.Status.LIVE)) {
            //if (s.isPermitted("GameModel:" + r +":gm" + aGm.getId())) {
            if (s.isPermitted("GameModel:View:gm" + gm.getId())
                || s.isPermitted("GameModel:Instantiate:gm" + gm.getId())
                || s.isPermitted("GameModel:Duplicate:gm" + gm.getId())) {
                games.add(gm);
            }
        }
        return games;
    }

    @PUT
    @Path("{entityId: [1-9][0-9]*}/status/{status: [A-Z]*}")
    public GameModel changeStatus(@PathParam("entityId") Long entityId, @PathParam("status") final GameModel.Status status) {
        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + entityId);
        GameModel gm = gameModelFacade.find(entityId);
        Subject s = SecurityUtils.getSubject();
        switch (status) {
            case LIVE:
                if (s.isPermitted("GameModel:View:gm" + gm.getId())
                    || s.isPermitted("GameModel:Instantiate:gm" + gm.getId())
                    || s.isPermitted("GameModel:Duplicate:gm" + gm.getId())) {
                    gameModelFacade.live(gm);
                }
                break;
            case BIN:
                if (s.isPermitted("GameModel:Delete:gm" + entityId)) {
                    gameModelFacade.bin(gm);
                }
                break;
            case DELETE:
                if (s.isPermitted("GameModel:Delete:gm" + entityId)) {
                    gameModelFacade.delete(gm);
                }
                break;

        }
        return gm;
    }

    @GET
    @Path("status/{status: [A-Z]*}")
    public Collection<GameModel> findByStatus(@PathParam("status") final GameModel.Status status) {
        Collection<GameModel> games = new ArrayList<>();
        Subject s = SecurityUtils.getSubject();
        for (GameModel gm : gameModelFacade.findTemplateGameModelsByStatus(status)) {
            if (s.isPermitted("GameModel:View:gm" + gm.getId())
                || s.isPermitted("GameModel:Instantiate:gm" + gm.getId())
                || s.isPermitted("GameModel:Duplicate:gm" + gm.getId())) {
                games.add(gm);
            }
        }
        return games;
    }

    @GET
    @Path("status/{status: [A-Z]*}/count")
    public int countByStatus(@PathParam("status") final GameModel.Status status) {
        Collection<GameModel> games = new ArrayList<>();
        Subject s = SecurityUtils.getSubject();
        for (GameModel gm : gameModelFacade.findTemplateGameModelsByStatus(status)) {
            if (s.isPermitted("GameModel:View:gm" + gm.getId())
                || s.isPermitted("GameModel:Instantiate:gm" + gm.getId())
                || s.isPermitted("GameModel:Duplicate:gm" + gm.getId())) {
                games.add(gm);
            }
        }
        return games.size();
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
        switch (entity.getStatus()) {
            case LIVE:
                gameModelFacade.bin(entity);
                break;
            case BIN:
                gameModelFacade.delete(entity);
                break;
        }
        // gameModelFacade.asyncRemove(entityId);
        return entity;
    }

    @DELETE
    public Collection<GameModel> deleteAll() {
        Collection<GameModel> games = new ArrayList<>();
        Subject s = SecurityUtils.getSubject();
        for (GameModel gm : gameModelFacade.findTemplateGameModelsByStatus(GameModel.Status.BIN)) {
            if (s.isPermitted("GameModel:Delete:gm" + gm.getId())) {
                gameModelFacade.delete(gm);
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

        //SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);
        //InputStream file = fileController.getFile(gameModelId, path);           // Retrieve file from content repository
        //
        //ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance
        //GameModel version = mapper.readValue(file, GameModel.class);            // and deserialize file
        //
        //GameModel gm = gameModelFacade.find(gameModelId);
        //gm.setChildVariableDescriptors(version.getChildVariableDescriptors());
        //gm.merge(version);
        // Todo: pages
        return this.createFromVersion(gameModelId, path);
    }

    /**
     *
     * @param gameModelId
     * @param path
     * @return
     * @throws IOException
     */
    @GET
    @Path("{gameModelId: [1-9][0-9]*}/CreateFromVersion/{path: .*}")
    public GameModel createFromVersion(@PathParam("gameModelId") Long gameModelId,
        @PathParam("path") String path) throws IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        return gameModelFacade.createFromVersion(gameModelId, path);
    }

    /**
     *
     * @param gameModelId
     * @param name
     * @throws RepositoryException
     * @throws IOException
     */
    @POST
    @Path("{gameModelId: [1-9][0-9]*}/CreateVersion/{version: .*}")
    public void createVersion(@PathParam("gameModelId") Long gameModelId,
        @PathParam("name") String name) throws RepositoryException, IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);
        gameModelFacade.createVersion(gameModelId, name);
    }

    /**
     *
     * @param gameModelId
     * @throws RepositoryException
     * @throws IOException
     */
    @POST
    @Path("{gameModelId: [1-9][0-9]*}/CreateVersion")
    public void createVersion(@PathParam("gameModelId") Long gameModelId) throws RepositoryException, IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);
        gameModelFacade.createVersion(gameModelId, new SimpleDateFormat("yyyy.MM.dd HH.mm.ss").format(new Date())
            + " by " + userFacade.getCurrentUser().getName());
    }

    /**
     *
     * @throws IOException
     * @throws RepositoryException
     */
    @POST
    @Path("AutoVersion")
    public void automaticVersionCreation() throws IOException, RepositoryException {
        gameModelFacade.automaticVersionCreation();
    }

}
