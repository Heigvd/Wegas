/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ILock;
import com.wegas.core.Helper;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PageFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.client.WegasErrorMessage;
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
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [0-9]+}/Page")
//@Path("GameModel/{gameModelId : [1-0][0-9]*}/Page")
@Consumes("application/json; charset=UTF-8")
@Produces("application/json; charset=UTF-8")
public class PageController {

    /**
     * List of page id a user cannot define himself. Lowercase only please.
     *
     * @see #assertPageIdValidity(java.lang.String)
     */
    private final String[] reservedPageId = {"index"};

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private RequestManager requestManager;

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private PageFacade pageFacade;

    private void assertPageIdValidityInternal(String pageId, String[] restriction) {
        for (String reserved : restriction) {
            if (pageId.equals(reserved)) {
                throw WegasErrorMessage.error("Invalid page id \"" + pageId + "\"");
            }
        }
    }

    private void assertPageIdValidity(String pageId, String... extraRestrictions) {
        if (Helper.isNullOrEmpty(pageId)) {
            throw WegasErrorMessage.error("Page id cannot be empty");
        } else {
            String lowPageId = pageId.toLowerCase();
            this.assertPageIdValidityInternal(lowPageId, reservedPageId);
            this.assertPageIdValidityInternal(lowPageId, extraRestrictions);
        }
    }

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
    @Path("/Page/{pageId : [A-Za-z0-9]+}")
    public Response getPage(@PathParam("gameModelId")
        final Long gameModelId,
        @PathParam("pageId") String pageId)
        throws RepositoryException, JsonProcessingException {

        this.assertPageIdValidity(pageId);

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
    @Path("/Index")
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
    @Path("/Page/{pageId : [A-Za-z0-9]+}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updatePage(@PathParam("gameModelId") Long gameModelId,
        @PathParam("pageId") String pageId,
        JsonNode content) throws RepositoryException, IOException {

        // not allowed to update the default
        this.assertPageIdValidity(pageId, "default");

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
    @Path("/IndexItem")
    public Response updateIndexItem(@PathParam("gameModelId") Long gameModelId,
        PageIndex.UpdatePayload payload)
        throws RepositoryException, JsonProcessingException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        pageFacade.updateItem(gm, payload);

        return Response.ok(pageFacade.getPageIndex(gm), MediaType.APPLICATION_JSON)
            .header("Page", "index").build();
    }

    /**
     * @param gameModelId 
     * @param payload contains the path of the item to delete
     *
     * @throws RepositoryException
     * @throws com.fasterxml.jackson.core.JsonProcessingException
     * @throws WegasErrorMessage if trying to delete not empty folder
     */
    @POST // one would use DELETE, but such a method does not handle payload well...
    @Path("/DeleteIndexItem")
    public Response deleteIndexItem(@PathParam("gameModelId") Long gameModelId,
        PageIndex.UpdatePayload payload)
        throws RepositoryException, JsonProcessingException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        PageIndex index = pageFacade.deleteItem(gm, payload);

        return Response.ok(index, MediaType.APPLICATION_JSON)
            .header("Page", "index").build();
    }

    @PUT
    @Path("/Move")
    public Response move(@PathParam("gameModelId") Long gameModelId,
        PageIndex.MovePayload payload) throws RepositoryException, JsonProcessingException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        pageFacade.moveItem(gm, payload);

        return Response.ok(pageFacade.getPageIndex(gm), MediaType.APPLICATION_JSON)
            .header("Page", "index").build();
    }

    @PUT
    @Path("/SetDefault/{pageId : [A-Za-z0-9]+}")
    public Response changeDefaultPage(@PathParam("gameModelId") Long gameModelId,
        @PathParam("pageId") String pageId)
        throws RepositoryException, JsonProcessingException {

        this.assertPageIdValidity(pageId, "default");

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        pageFacade.setDefaultPage(gm, pageId);

        return Response.ok(pageFacade.getPageIndex(gm), MediaType.APPLICATION_JSON)
            .header("Page", "index").build();
    }

    @POST
    @Path("/IndexItem")
    public Response createIndexItem(@PathParam("gameModelId") Long gameModelId,
        PageIndex.NewItemPayload payload) throws RepositoryException, IOException {

        GameModel gm = gameModelFacade.find(gameModelId);
        requestManager.assertUpdateRight(gm);

        final ILock gameModelLock = hzInstance.getLock("page-" + gameModelId);
        gameModelLock.lock();
        try {
            PageIndex newIndex = pageFacade.createIndexItem(gm, payload);

            return Response.ok(newIndex, MediaType.APPLICATION_JSON)
                .header("Page", "index").build();
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
    @Path("/Duplicate/{pageId : [A-Za-z0-9]+}")
    public Response duplicate(@PathParam("gameModelId") Long gameModelId,
        @PathParam("pageId") String pageId) throws RepositoryException, IOException {

        this.assertPageIdValidity(pageId, "default");

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
    @Path("/Page/{pageId : [A-Za-z0-9]+}")
    public PageIndex deletePage(@PathParam("gameModelId") Long gameModelId,
        @PathParam("pageId") String pageId)
        throws RepositoryException, JsonProcessingException {

        this.assertPageIdValidity(pageId, "default");

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
    @Path("/Patch/{pageId : [A-Za-z0-9]+}")
    @Consumes(MediaType.TEXT_PLAIN)
    public Response patch(@PathParam("gameModelId") Long gameModelId,
        @PathParam("pageId") String pageId,
        String strPatch) throws RepositoryException, JsonProcessingException {

        this.assertPageIdValidity(pageId, "default");

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
