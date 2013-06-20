/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.exception.WegasException;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.Pages;
import java.io.IOException;
import java.util.Map;
import java.util.Map.Entry;
import javax.ejb.Stateless;
import javax.jcr.RepositoryException;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.shiro.SecurityUtils;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jettison.json.JSONException;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@Path("Page/{gameModelId : [0-9]+}")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PageController {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(PageController.class);
    static final private String ADMIN_REPO_ID = "0";

    /**
     * Retrieves all GameModel's page.
     *
     * @param gameModelId The GameModel's ID
     * @return A JSON map <String, JSONOnject> representing pageId:Content
     * @throws RepositoryException
     * @throws WegasException
     */
    @GET
    public Response getPages(@PathParam("gameModelId") String gameModelId)
            throws RepositoryException, WegasException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        Pages pages = new Pages(gameModelId);
        return Response.ok(pages.getPages(), MediaType.APPLICATION_JSON).header("Page", "*").build();
    }

    /**
     * Retrieve the specified GameModel's page
     *
     * @param gameModelId The GameModel's ID
     * @param pageId The specific page's ID
     * @return A JSONObject, the page Content
     * @throws RepositoryException
     * @throws WegasException
     */
    @GET
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}")
    public Response getPage(@PathParam("gameModelId") String gameModelId,
            @PathParam("pageId") String pageId)
            throws RepositoryException, WegasException {
        Pages pages = new Pages(gameModelId);
        Page page = pages.getPage(pageId);

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + gameModelId);

        if (page == null) {                                                     //try admin repo
            page = this.getAdminPage(pageId);
            if (page == null) {
                return Response.status(Response.Status.NOT_FOUND).header("Page", pageId).build();
            }
        }
        return Response.ok(page.getContent(), MediaType.APPLICATION_JSON)
                .header("Page", pageId).build();

    }

    /**
     * Retrieve gameModel's page index
     *
     * @param gameModelId
     * @return A List of page index
     * @throws RepositoryException
     * @throws WegasException
     */
    @GET
    @Path("/index")
    public Response getIndex(@PathParam("gameModelId") String gameModelId)
            throws RepositoryException, WegasException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        Pages pages = new Pages(gameModelId);
        return Response.ok(pages.getIndex(), MediaType.APPLICATION_JSON)
                .header("Page", "index").build();
    }

    /**
     * Replaces the specified pages with the provided content or creates it if
     * it doesn't exist
     *
     * @param gameModelId The GameModel's ID
     * @param pageId The specific page to replace
     * @param content A JSONObject
     * @return The stored page
     * @throws RepositoryException
     * @throws IOException
     * @throws WegasException
     */
    @PUT
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response setPage(@PathParam("gameModelId") String gameModelId,
            @PathParam("pageId") String pageId,
            JsonNode content) throws RepositoryException, IOException, WegasException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        Pages pages = new Pages(gameModelId);
        Page page = new Page(pageId, content);
        pages.store(page);
        return Response.ok(pages.getPage(pageId).getContent(), MediaType.APPLICATION_JSON)
                .header("Page", pageId).build();
    }

    /**
     *
     * @param gameModelId
     * @param pageId
     * @param page
     * @return
     * @throws RepositoryException
     * @throws WegasException
     */
    @PUT
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}/meta")
    public Response setMeta(@PathParam("gameModelId") String gameModelId,
            @PathParam("pageId") String pageId,
            Page page) throws RepositoryException, WegasException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        Pages pages = new Pages(gameModelId);
        page.setId(pageId);
        pages.setMeta(page);
        return Response.ok(pages.getIndex(), MediaType.APPLICATION_JSON)
                .header("Page", "index").build();
    }

    /**
     * Create a new page. page'is is generated
     *
     * @param gameModelId The GameModel's ID
     * @param content A JSONObject
     * @param name String optional page name
     * @return The stored page
     * @throws RepositoryException
     * @throws IOException
     * @throws WegasException
     */
    @PUT
    public Response createPage(@PathParam("gameModelId") String gameModelId, JsonNode content, String name)
            throws RepositoryException, IOException, WegasException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);
        Pages pages = new Pages(gameModelId);
        if (name == null || name.equals("")) {

            Map<String, String> index = pages.getIndex();
            Integer pageId = 1;
            while (index.containsKey(pageId.toString())) {
                pageId++;
            }
            name = pageId.toString();
        }
        Page page = new Page(name, content);
        pages.store(page);
        return Response.ok(pages.getPage(name).getContent(), MediaType.APPLICATION_JSON)
                .header("Page", name).build();
    }

    @GET
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}/duplicate")
    public Response duplicate(@PathParam("gameModelId") String gameModelId,
            @PathParam("pageId") String pageId) throws RepositoryException, IOException {
        final Pages pages = new Pages(gameModelId);
        Page page = pages.getPage(pageId);
        String pageName = null;
        if (page == null) {
            page = this.getAdminPage(pageId);                                   //check admin pages
            if (page == null) {
                throw new WegasException("Attempt to duplicate an inexistant page");
            }
            pageName = page.getId();
        }
        return this.createPage(gameModelId, page.getContent(), pageName);
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
     * @throws WegasException
     */
    @POST
    public Response addPages(@PathParam("gameModelId") String gameModelId, Map<String, JsonNode> pageMap)
            throws RepositoryException, JSONException, WegasException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        Pages pages = new Pages(gameModelId);
        for (Entry<String, JsonNode> p : pageMap.entrySet()) {
            pages.store(new Page(p.getKey(), p.getValue()));
        }
        return getPages(gameModelId);
    }

    /**
     * Delete all GameModel's pages
     *
     * @param gameModelId The GameModel's ID
     * @return
     * @throws RepositoryException
     * @throws WegasException
     */
    @DELETE
    public Response delete(@PathParam("gameModelId") String gameModelId) throws RepositoryException, WegasException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        Pages pages = new Pages(gameModelId);
        pages.delete();
        return Response.ok().header("Page", "*").build();
    }

    /**
     * Delete the specified page from the specified GameModel
     *
     * @param gameModelId The GameModel's ID
     * @param pageId The page's ID
     * @return
     * @throws RepositoryException
     * @throws WegasException
     */
    @DELETE
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}")
    public Response deletePage(@PathParam("gameModelId") String gameModelId,
            @PathParam("pageId") String pageId)
            throws RepositoryException, WegasException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        Pages pages = new Pages(gameModelId);
        pages.deletePage(pageId);
        return Response.ok().header("Page", pageId).build();
    }

    /**
     * Patches specified Page
     *
     * @param gameModelId The GameModel's ID
     * @param pageId The page's ID
     * @param patch The patch based on Myer's diff algorithm
     * @return The new patched page
     * @throws RepositoryException
     * @throws JSONException
     * @throws IOException
     * @throws WegasException
     */
    @PUT
    @Path("/{pageId : ([1-9][0-9]*)|[A-Za-z]+}")
    @Consumes(MediaType.TEXT_PLAIN)
    public Response patch(@PathParam("gameModelId") String gameModelId,
            @PathParam("pageId") String pageId,
            String patch) throws RepositoryException, JSONException, IOException, WegasException {

        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + gameModelId);

        Pages pages = new Pages(gameModelId);
        Page page = pages.getPage(pageId);
        if (page == null) {
            return Response.status(Response.Status.NOT_FOUND).header("Page", pageId).build();
        }
        page.patch(patch);
        pages.store(page);
        return Response.ok(page.getContent(), MediaType.APPLICATION_JSON)
                .header("Page", pageId).build();
    }

    private Page getAdminPage(String id) throws RepositoryException {
        Pages pages = new Pages(PageController.ADMIN_REPO_ID);
        return pages.getPage(id);
    }
}
