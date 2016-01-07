/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.fge.jsonpatch.JsonPatchException;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.Pages;
import org.apache.shiro.SecurityUtils;
import org.codehaus.jettison.json.JSONException;
import org.slf4j.LoggerFactory;

import javax.ejb.Stateless;
import javax.jcr.RepositoryException;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.util.Map;
import java.util.Map.Entry;

/**
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [0-9]+}/Page")
@Consumes("application/json; charset=UTF-8")
@Produces("application/json; charset=UTF-8")
public class PageController {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(PageController.class);

    static final private String ADMIN_REPO_ID = "0";

    /**
     * Retrieves all GameModel's page.
     *
     * @param gameModelId The GameModel's ID
     * @return A JSON map <String, JSONOnject> representing pageId:Content
     * @throws RepositoryException
     */
    @GET
    public Response getPages(@PathParam("gameModelId") String gameModelId)
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
    public Response getPage(@PathParam("gameModelId") final String gameModelId,
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
            return Response.ok(page.getContent(), MediaType.APPLICATION_JSON)
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
    public Response getIndex(@PathParam("gameModelId") String gameModelId)
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
    public Response setPage(@PathParam("gameModelId") String gameModelId,
                            @PathParam("pageId") String pageId,
                            JsonNode content) throws RepositoryException, IOException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            Page page = new Page(pageId, content);
            pages.store(page);
            return Response.ok(pages.getPage(pageId).getContent(), MediaType.APPLICATION_JSON)
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
    public Response setMeta(@PathParam("gameModelId") String gameModelId,
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
    public Response move(@PathParam("gameModelId") String gameModelId,
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
    public Response createPage(@PathParam("gameModelId") String gameModelId, JsonNode content)
        throws RepositoryException, IOException {
        return createPage(gameModelId, content, null);
    }

    /**
     * Create a page from JsonNode with the specified name
     *
     * @param gameModelId
     * @param content
     * @param name
     * @return
     * @throws javax.jcr.RepositoryException
     * @throws java.io.IOException
     */
    private Response createPage(String gameModelId, JsonNode content, String name)
        throws RepositoryException, IOException {
        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);
        try (final Pages pages = new Pages(gameModelId)) {
            if (name == null || name.equals("")) {
                Integer pageId = 1;
                while (pages.pageExist(pageId.toString())) {
                    pageId++;
                }
                name = pageId.toString();
            }
            ((ObjectNode) content).put("@index", pages.size());
            Page page = new Page(name, content);
            pages.store(page);
            return Response.ok(pages.getPage(name).getContent(), MediaType.APPLICATION_JSON)
                .header("Page", name).build();
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
    public Response duplicate(@PathParam("gameModelId") String gameModelId,
                              @PathParam("pageId") String pageId) throws RepositoryException, IOException {
        try (final Pages pages = new Pages(gameModelId)) {
            Page page = pages.getPage(pageId);
            String pageName = null;
            if (page == null) {
                page = this.getAdminPage(pageId);                                   //check admin pages
                if (page == null) {
                    throw WegasErrorMessage.error("Attempt to duplicate an inexistant page");
                }
                pageName = page.getId();
            } else if (!Helper.isNullOrEmpty(page.getName())) {
                ((ObjectNode) page.getContent()).put("@name", page.getName() + "-copy");
            }
            return this.createPage(gameModelId, page.getContent(), pageName);
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
    public Response addPages(@PathParam("gameModelId") String gameModelId, Map<String, JsonNode> pageMap)
        throws RepositoryException, JSONException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            for (Entry<String, JsonNode> p : pageMap.entrySet()) {
                pages.store(new Page(p.getKey(), p.getValue()));
            }
            return getPages(gameModelId);
        }
    }

    /**
     * Delete all GameModel's pages
     *
     * @param gameModelId The GameModel's ID
     * @return
     * @throws RepositoryException
     */
    @DELETE
    public Response delete(@PathParam("gameModelId") String gameModelId) throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            pages.delete();
            return Response.ok().header("Page", "*").build();
        }
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
    public Response deletePage(@PathParam("gameModelId") String gameModelId,
                               @PathParam("pageId") String pageId)
        throws RepositoryException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        try (final Pages pages = new Pages(gameModelId)) {
            pages.deletePage(pageId);
            return this.getIndex(gameModelId);
        }
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
    public Response patch(@PathParam("gameModelId") String gameModelId,
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
