/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.fge.jsonpatch.JsonPatchException;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ILock;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.Pages;
import org.apache.shiro.SecurityUtils;
import org.codehaus.jettison.json.JSONException;
import org.slf4j.LoggerFactory;

import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.jcr.RepositoryException;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.util.Map;
import java.util.Map.Entry;

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

    /**
     * Retrieves all GameModel's page.
     *
     * @param gameModelId The GameModel's ID
     * @return A JSON map <String, JSONOnject> representing pageId:Content
     * @throws RepositoryException
     */
    @GET
    public Response getPages(@PathParam("gameModelId") Long gameModelId)
            throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (Pages pages = new Pages(gameModelId)) {
            return Response.ok(pages.getPagesContent(), MediaType.APPLICATION_JSON).header("Page", "*").build();
        }
    }

    /**
     * Retrieve the specified GameModel's page
     *
     * @param gameModelId The GameModel's ID
     * @param pageId      The specific page's ID
     * @return A JSONObject, the page Content
     * @throws RepositoryException
     */
    @GET
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}")
    public Response getPage(@PathParam("gameModelId") final Long gameModelId,
                            @PathParam("pageId") String pageId)
            throws RepositoryException {
        try (final Pages pages = new Pages(gameModelId)) {
            Page page;
            if (pageId.equals("default")) {
                page = pages.getDefaultPage();
            } else {
                page = pages.getPage(pageId);
            }

            SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + gameModelId);

            if (page == null) {                                                     //try admin repo
                page = this.getAdminPage(pageId);
                if (page == null) {
                    return Response.status(Response.Status.NOT_FOUND).header("Page", pageId).build();
                }
            }
            return Response.ok(page.getContentWithMeta(), MediaType.APPLICATION_JSON)
                    .header("Page", page.getId()).build();
        }
    }

    /**
     * Retrieve gameModel's page index
     *
     * @param gameModelId
     * @return A List of page index
     * @throws RepositoryException
     */
    @GET
    @Path("/index")
    public Response getIndex(@PathParam("gameModelId") Long gameModelId)
            throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            return Response.ok(pages.getIndex(), MediaType.APPLICATION_JSON)
                    .header("Page", "index").build();
        }
    }

    /**
     * Replaces the specified pages with the provided content or creates it if
     * it doesn't exist
     *
     * @param gameModelId The GameModel's ID
     * @param pageId      The specific page to replace
     * @param content     A JSONObject
     * @return The stored page
     * @throws RepositoryException
     * @throws IOException
     */
    @PUT
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response setPage(@PathParam("gameModelId") Long gameModelId,
                            @PathParam("pageId") String pageId,
                            JsonNode content) throws RepositoryException, IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            Page page = new Page(pageId, content);
            pages.store(page);
            return Response.ok(pages.getPage(pageId).getContentWithMeta(), MediaType.APPLICATION_JSON)
                    .header("Page", pageId).build();
        }
    }

    /**
     * @param gameModelId
     * @param pageId
     * @param page
     * @return
     * @throws RepositoryException
     */
    @PUT
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}/meta")
    public Response setMeta(@PathParam("gameModelId") Long gameModelId,
                            @PathParam("pageId") String pageId,
                            Page page) throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            page.setId(pageId);
            pages.setMeta(page);
            return Response.ok(pages.getIndex(), MediaType.APPLICATION_JSON)
                    .header("Page", "index").build();
        }
    }

    @PUT
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}/move/{pos: ([0-9]+)}")
    public Response move(@PathParam("gameModelId") Long gameModelId,
                         @PathParam("pageId") String pageId,
                         @PathParam("pos") int pos) throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            pages.move(pageId, pos);
            return Response.ok(pages.getIndex(), MediaType.APPLICATION_JSON)
                    .header("Page", "index").build();
        }
    }

    /**
     * Create a new page. page'id is generated. Page has no name
     *
     * @param gameModelId The GameModel's ID
     * @param content     A JSONObject
     * @return The stored page
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
     * @return
     * @throws javax.jcr.RepositoryException
     * @throws java.io.IOException
     */
    private Response createPage(Long gameModelId, JsonNode content, String id)
            throws RepositoryException, IOException {
        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);
        final ILock gameModelLock = hzInstance.getLock("page-" + gameModelId);
        gameModelLock.lock();
        try (final Pages pages = new Pages(gameModelId)) {
            if (Helper.isNullOrEmpty(id)) {
                Integer pageId = 1;
                while (pages.pageExist(pageId.toString())) {
                    pageId++;
                }
                id = pageId.toString();
            }
            Page page = new Page(id, content);
            page.setIndex((int) pages.size()); // May loose some values if we had that many pages...
            pages.store(page);
            return Response.ok(pages.getPage(id).getContentWithMeta(), MediaType.APPLICATION_JSON)
                    .header("Page", id).build();
        } finally {
            gameModelLock.unlock();
        }
    }

    /**
     * @param gameModelId
     * @param pageId
     * @return
     * @throws RepositoryException
     * @throws IOException
     */
    @GET
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}/duplicate")
    public Response duplicate(@PathParam("gameModelId") Long gameModelId,
                              @PathParam("pageId") String pageId) throws RepositoryException, IOException {
        try (final Pages pages = new Pages(gameModelId)) {
            Page oldPage = pages.getPage(pageId);
            if (oldPage == null) {
                oldPage = this.getAdminPage(pageId);                                   //check admin pages
                if (oldPage == null) {
                    throw WegasErrorMessage.error("Attempt to duplicate an inexistant page");
                }
                return this.createPage(gameModelId, oldPage.getContent().deepCopy(), oldPage.getId()); // Override admin page
            }
            final ObjectNode newContent = oldPage.getContent().deepCopy();
            if (!Helper.isNullOrEmpty(oldPage.getName())) {
                newContent.put("@name", oldPage.getName() + "-copy");
            }

            return this.createPage(gameModelId, newContent, null);
        }
    }

    /**
     * Merges existing gameModelId's pages with the provided content, replacing
     * existing pages with those given, storing new pages and keeping previous
     * pages.
     *
     * @param gameModelId The GameMoldel's ID
     * @param pageMap
     * @return The merge result
     * @throws RepositoryException
     * @throws JSONException
     */
    @POST
    public Response addPages(@PathParam("gameModelId") Long gameModelId, Map<String, JsonNode> pageMap)
            throws RepositoryException, JSONException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            for (Entry<String, JsonNode> p : pageMap.entrySet()) {
                pages.store(new Page(p.getKey(), p.getValue()));
            }
        }
        return getPages(gameModelId);
    }

    /**
     * Delete all GameModel's pages
     *
     * @param gameModelId The GameModel's ID
     * @return
     * @throws RepositoryException
     */
    @DELETE
    public Response delete(@PathParam("gameModelId") Long gameModelId) throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            pages.delete();
        }
        return Response.ok().header("Page", "*").build();
    }

    /**
     * Delete the specified page from the specified GameModel
     *
     * @param gameModelId The GameModel's ID
     * @param pageId      The page's ID
     * @return
     * @throws RepositoryException
     */
    @DELETE
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}")
    public Response deletePage(@PathParam("gameModelId") Long gameModelId,
                               @PathParam("pageId") String pageId)
            throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            pages.deletePage(pageId);
        }
        return this.getIndex(gameModelId);
    }

    /**
     * Patches specified Page
     *
     * @param gameModelId The GameModel's ID
     * @param pageId      The page's ID
     * @param patch       The patch based on Myer's diff algorithm
     * @return The new patched page
     * @throws RepositoryException
     * @throws JSONException
     * @throws IOException
     */
    @PUT
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}")
    @Consumes(MediaType.TEXT_PLAIN)
    public Response patch(@PathParam("gameModelId") Long gameModelId,
                          @PathParam("pageId") String pageId,
                          String patch) throws RepositoryException, JSONException, IOException, JsonPatchException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            final Page page = pages.getPage(pageId);
            if (page == null) {
                return Response.status(Response.Status.NOT_FOUND).header("Page", pageId).build();
            }
            JsonNode patches = (new ObjectMapper()).readTree(patch);
            page.patch(patches);
            pages.store(page);
            return Response.ok(page.getContent(), MediaType.APPLICATION_JSON)
                    .header("Page", pageId).build();
        }
    }

    private Page getAdminPage(String id) throws RepositoryException {
        try (final Pages pages = new Pages(PageController.ADMIN_REPO_ID)) {
            return pages.getPage(id);
        }
    }
}
