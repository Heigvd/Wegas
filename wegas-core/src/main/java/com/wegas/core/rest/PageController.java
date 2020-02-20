/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ILock;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PageFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.PageIndex;
import com.wegas.core.persistence.game.GameModel;
import java.io.IOException;
import java.io.StringReader;
import java.util.Map;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonPatch;
import javax.json.JsonReader;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [0-9]+}/Page")
//@Path("GameModel/{gameModelId : [1-0][0-9]*}/Page")
@Consumes("application/json; charset=UTF-8")
@Produces("application/json; charset=UTF-8")
public class PageController {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(PageController.class);

    static final private Long ADMIN_REPO_ID = 0L;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private RequestManager requestManager;

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private PageFacade pageFacade;

    /**
     * Retrieves all GameModel's page.
     *
     * @param gameModelId The GameModel's ID
     *
     * @return A JSON map {String to JSONOnject} representing pageId:Content
     *
     * @throws RepositoryException
     */
    @GET
    public Response getPages(@PathParam("gameModelId") Long gameModelId)
        throws RepositoryException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        return Response.ok(gm.getPages(), MediaType.APPLICATION_JSON).header("Page", "*").build();
    }

    /**
     * Retrieve the specified GameModel's page
     *
     * @param gameModelId The GameModel's ID
     * @param pageId      The specific page's ID
     *
     * @return A JSONObject, the page Content
     *
     * @throws RepositoryException
     */
    @GET
    @Path("/{pageId : [A-Za-z0-9]+}")
    public Response getPage(@PathParam("gameModelId") final Long gameModelId,
        @PathParam("pageId") String pageId)
        throws RepositoryException {

        // find gameModel to ensure currentUser has readRight
        GameModel gm = gameModelFacade.find(gameModelId);

        Page page;
        try {
            page = pageFacade.getPage(gm, pageId);
        } catch (RepositoryException ex) {
            page = null;
        }

        if (page == null) {
            return Response.status(Response.Status.NOT_FOUND).header("Page", pageId).build();
        } else {
            return Response.ok(page.getContent(), MediaType.APPLICATION_JSON)
                .header("Page", page.getId()).build();
        }
    }

    /**
     * Retrieve gameModel's page index
     *
     * @param gameModelId
     *
     * @return A List of page index
     *
     * @throws RepositoryException
     * @throws com.fasterxml.jackson.core.JsonProcessingException
     */
    @GET
    @Path("/index")
    public PageIndex getIndex(@PathParam("gameModelId") Long gameModelId)
        throws RepositoryException, JsonProcessingException {

        // find gameModel to ensure currentUser has readRight
        GameModel gm = gameModelFacade.find(gameModelId);

        return pageFacade.getPageIndex(gm);
    }

    /**
     * Replaces the specified pages with the provided content or creates it if it doesn't exist
     *
     * @param gameModelId The GameModel's ID
     * @param pageId      The specific page to replace
     * @param content     A JSONObject
     *
     * @return The stored page
     *
     * @throws RepositoryException
     * @throws IOException
     */
    @PUT
    @Path("/{pageId : [A-Za-z0-9]+}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response setPage(@PathParam("gameModelId") Long gameModelId,
        @PathParam("pageId") String pageId,
        JsonNode content) throws RepositoryException, IOException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        pageFacade.setPage(gm, pageId, content);

        return Response.ok(pageFacade.getPage(gm, pageId).getContent(), MediaType.APPLICATION_JSON)
            .header("Page", pageId).build();
    }

    /**
     * @param gameModelId
     * @param payload
     *
     * @return strange http response with information set indo http headers...
     *
     * @throws RepositoryException
     * @throws com.fasterxml.jackson.core.JsonProcessingException
     */
    @PUT
    @Path("/rename")
    public Response renameItem(@PathParam("gameModelId") Long gameModelId,
        PageIndex.RenamePayload payload)
        throws RepositoryException, JsonProcessingException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        pageFacade.renameItem(gm, payload);

        return Response.ok(pageFacade.getPageIndex(gm), MediaType.APPLICATION_JSON)
            .header("Page", "index").build();
    }

    @PUT
    @Path("/move")
    public Response move(@PathParam("gameModelId") Long gameModelId,
        PageIndex.MovePayload payload) throws RepositoryException, JsonProcessingException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        pageFacade.moveItem(gm, payload);

        return Response.ok(pageFacade.getPageIndex(gm), MediaType.APPLICATION_JSON)
            .header("Page", "index").build();
    }

    /**
     * Create a new page. page'id is generated. Page has no name
     *
     * @param gameModelId The GameModel's ID
     * @param content     A JSONObject
     *
     * @return The stored page
     *
     * @throws RepositoryException
     * @throws IOException
     */
    @PUT
    public Response createPage(@PathParam("gameModelId") Long gameModelId, JsonNode content)
        throws RepositoryException, IOException {
        return createPage(gameModelId, content, null);
    }

    /**
     * Create a page from JsonNode with the specified optional id. Updates the index
     *
     * @param gameModelId
     * @param content
     * @param id
     *
     * @return some http response with data into HTTP headers
     *
     * @throws javax.jcr.RepositoryException
     * @throws java.io.IOException
     */
    private Response createPage(Long gameModelId, JsonNode content, String id)
        throws RepositoryException, IOException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        final ILock gameModelLock = hzInstance.getLock("page-" + gameModelId);
        gameModelLock.lock();
        try {
            Page page = pageFacade.createPage(gm, id, content);
            return Response.ok(page.getContent(), MediaType.APPLICATION_JSON)
                .header("Page", page.getId()).build();
        } finally {
            gameModelLock.unlock();
        }
    }

    /**
     * @param gameModelId
     * @param pageId
     *
     * @return strange http response which contains strange stuff {@link #createPage(java.lang.Long, com.fasterxml.jackson.databind.JsonNode)
     *         }
     *
     * @throws RepositoryException
     * @throws IOException
     */
    @GET
    @Path("/{pageId : [A-Za-z0-9]+}/duplicate")
    public Response duplicate(@PathParam("gameModelId") Long gameModelId,
        @PathParam("pageId") String pageId) throws RepositoryException, IOException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        final ILock gameModelLock = hzInstance.getLock("page-" + gameModelId);
        gameModelLock.lock();
        try {
            Page page = pageFacade.duplicatePage(gm, pageId);
            return Response.ok(page.getContent(), MediaType.APPLICATION_JSON)
                .header("Page", page.getId()).build();
        } finally {
            gameModelLock.unlock();
        }

    }

    /**
     * Merges existing gameModelId's pages with the provided content, replacing existing pages with
     * those given, storing new pages and keeping previous pages.
     *
     * @param gameModelId The GameMoldel's ID
     * @param pageMap
     *
     * @return The merge result
     *
     * @throws RepositoryException
     */
    @POST
    public Response addPages(@PathParam("gameModelId") Long gameModelId, Map<String, JsonNode> pageMap)
        throws RepositoryException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        pageFacade.addPages(gm, pageMap);

        return getPages(gameModelId);
    }

    /**
     * Delete all GameModel's pages
     *
     * @param gameModelId The GameModel's ID
     *
     * @return HTTP 200 ok with "Page: *" header
     *
     * @throws RepositoryException
     */
    @DELETE
    public Response delete(@PathParam("gameModelId") Long gameModelId) throws RepositoryException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        pageFacade.deletePages(gm);

        return Response.ok().header("Page", "*").build();
    }

    /**
     * Delete the specified page from the specified GameModel
     *
     * @param gameModelId The GameModel's ID
     * @param pageId      The page's ID
     *
     * @return {@link #getIndex(java.lang.Long) } without the deleted page
     *
     * @throws RepositoryException
     * @throws com.fasterxml.jackson.core.JsonProcessingException
     */
    @DELETE
    @Path("/{pageId : [A-Za-z0-9]+}")
    public PageIndex deletePage(@PathParam("gameModelId") Long gameModelId,
        @PathParam("pageId") String pageId)
        throws RepositoryException, JsonProcessingException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        pageFacade.deletePage(gm, pageId);

        return this.getIndex(gameModelId);
    }

    /**
     * Patches specified Page
     *
     * @param gameModelId The GameModel's ID
     * @param pageId      The page's ID
     * @param strPatch    The patch based on Myer's diff algorithm
     *
     * @return The new patched page
     *
     * @throws RepositoryException
     * @throws JsonProcessingException
     */
    @PUT
    @Path("/{pageId : [A-Za-z0-9]+}")
    @Consumes(MediaType.TEXT_PLAIN)
    public Response patch(@PathParam("gameModelId") Long gameModelId,
        @PathParam("pageId") String pageId,
        String strPatch) throws RepositoryException, JsonProcessingException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        try (JsonReader reader = Json.createReader(new StringReader(strPatch))) {
            JsonArray patchArray = reader.readArray();
            JsonPatch patch = Json.createPatchBuilder(patchArray).build();

            try {
                Page page = pageFacade.patchPage(gm, pageId, patch);
                return Response.ok(page.getContent(), MediaType.APPLICATION_JSON)
                    .header("Page", pageId).build();
            } catch (RepositoryException ex) {
                return Response.status(Response.Status.NOT_FOUND).header("Page", pageId).build();
            }
        }
    }
}
