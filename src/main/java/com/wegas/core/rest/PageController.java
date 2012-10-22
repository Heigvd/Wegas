/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.Pages;
import com.wegas.exception.WegasException;
import java.io.IOException;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.jcr.RepositoryException;
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
import org.codehaus.jackson.JsonNode;
import org.codehaus.jettison.json.JSONException;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@Path("Page/{gameModelId : [1-9][0-9]*}")
public class PageController {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(PageController.class);
    @EJB
    private GameModelFacade gmFacade;

    /**
     * Retrive all GameModel's page.
     *
     * @param gameModelId The GameModel's ID
     * @return A JSON map <Integer, JSONOnject> representing pageId:Content
     * @throws RepositoryException
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPages(@PathParam("gameModelId") String gameModelId)
            throws RepositoryException, WegasException {
        Pages pages = getGameModelPages(new Long(gameModelId));
        return Response.ok(pages.getPages(), MediaType.APPLICATION_JSON).header("Page", "*").build();
    }

    /**
     * Retrieve the specified GameModel's page
     *
     * @param gameModelId The GameModel's ID
     * @param pageId The specific page's ID
     * @return A JSONObject, the page Content
     * @throws RepositoryException
     */
    @GET
    @Path("/{pageId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getPage(@PathParam("gameModelId") String gameModelId, @PathParam("pageId") String pageId)
            throws RepositoryException, WegasException {
        Pages pages = getGameModelPages(new Long(gameModelId));
        Page page = pages.getPage(new Integer(pageId));
        if (page == null) {
            return Response.status(404).header("Page", pageId).build();
            // return Response.noContent().header("Page", pageId).build();
        } else {
            return Response.ok(page.getContent(), MediaType.APPLICATION_JSON).header("Page", pageId).build();
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
    @Produces(MediaType.APPLICATION_JSON)
    public Response getIndex(@PathParam("gameModelId") String gameModelId)
            throws RepositoryException, WegasException {
        Pages pages = getGameModelPages(new Long(gameModelId));
        return Response.ok(pages.getIndex(), MediaType.APPLICATION_JSON).header("Page", "index").build();
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
     */
    @PUT
    @Path("/{pageId : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response setPage(@PathParam("gameModelId") String gameModelId, @PathParam("pageId") String pageId, JsonNode content)
            throws RepositoryException, IOException, WegasException {
        Pages pages = getGameModelPages(new Long(gameModelId));
        Page page = new Page(new Integer(pageId), content);
        pages.store(page);
        return Response.ok(pages.getPage(new Integer(pageId)).getContent(), MediaType.APPLICATION_JSON).header("Page", pageId).build();
    }

    /**
     * Create a new page. page'is is generated
     *
     * @param gameModelId The GameModel's ID
     * @param content A JSONObject
     * @return The stored page
     * @throws RepositoryException
     */
    @POST
    @Path("/new")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createPage(@PathParam("gameModelId") String gameModelId, JsonNode content)
            throws RepositoryException, IOException, WegasException {
        Pages pages = getGameModelPages(new Long(gameModelId));
        List<Integer> index = pages.getIndex();
        Integer pageId = 1;
        while (index.contains(pageId)) {
            pageId++;
        }
        Page page = new Page(new Integer(pageId), content);
        pages.store(page);
        return Response.ok(pages.getPage(new Integer(pageId)).getContent(), MediaType.APPLICATION_JSON).header("Page", pageId).build();
    }

    /**
     * Merges exisiting gameModelId's pages with the provided content, replacing
     * existing pages with those given, storing new pages and keeping previous
     * pages.
     *
     * @param gameModelId The GameMoldel's ID
     * @param content A JSON map <Integer, JSONObject>
     * @return The merge result
     * @throws RepositoryException
     * @throws JSONException
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response setPages(@PathParam("gameModelId") String gameModelId, Map<Integer, JsonNode> pageMap)
            throws RepositoryException, JSONException, WegasException {
        Pages pages = getGameModelPages(new Long(gameModelId));
        //pages.delete();                                                       //remove first existing Pages currently merges, uncomment to replace
        Iterator kIterator = pageMap.keySet().iterator();
        while (kIterator.hasNext()) {
            Integer key = (Integer) kIterator.next();
            Page page = new Page(key, pageMap.get(key));
            pages.store(page);
        }
        return getPages(gameModelId);
    }

    /**
     * Delete all gamemodel's pages
     *
     * @param gameModelId The GameModel's ID
     * @throws RepositoryException
     */
    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("gameModelId") String gameModelId) throws RepositoryException, WegasException {
        Pages pages = getGameModelPages(new Long(gameModelId));
        pages.delete();
        return Response.ok().header("Page", "*").build();
    }

    /**
     * Delete the specified page from the specified GameModel
     *
     * @param gameModelId The GameModel's ID
     * @param pageId The page's ID
     * @throws RepositoryException
     */
    @DELETE
    @Path("/{pageId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deletePage(@PathParam("gameModelId") String gameModelId, @PathParam("pageId") String pageId)
            throws RepositoryException, WegasException {
        Pages pages = getGameModelPages(new Long(gameModelId));
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
     */
    @PUT
    @Path("/{pageId : [1-9][0-9]*}")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response patch(@PathParam("gameModelId") String gameModelId, @PathParam("pageId") Integer pageId, String patch)
            throws RepositoryException, JSONException, IOException, WegasException {
        Pages pages = getGameModelPages(new Long(gameModelId));
        Page page = pages.getPage(pageId);
        if (page == null) {
            return Response.status(404).header("Page", pageId).build();
        }
        page.patch(patch);
        pages.store(page);
        return Response.ok(page.getContent(), MediaType.APPLICATION_JSON).header("Page", pageId).build();
    }

    private Pages getGameModelPages(Long gameModelId) throws WegasException, RepositoryException {
        try {
            return new Pages(gmFacade.find(gameModelId).getName());
        } catch (NullPointerException ex) {
            throw new WegasException("GameModel id " + gameModelId + " not found", ex);
        }
    }
}
