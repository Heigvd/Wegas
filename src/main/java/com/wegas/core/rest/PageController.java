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
import com.wegas.core.persistence.game.GameModel;
import java.util.Iterator;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.jcr.RepositoryException;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@Path("Page/GameModel/{gameModelId : [1-9][0-9]*}")
public class PageController {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(PageController.class);
    @EJB
    private GameModelFacade gmFacade;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public JSONObject getPages(@PathParam("gameModelId") String gameModelId) throws RepositoryException {
        GameModel gm = gmFacade.find(new Long(gameModelId));
        Pages pages = new Pages(gm.getName());
        return pages.getPages();
    }

    @GET
    @Path("/{pageId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public JSONObject getPage(@PathParam("gameModelId") String gameModelId, @PathParam("pageId") String pageId) throws RepositoryException {
        GameModel gm = gmFacade.find(new Long(gameModelId));
        Pages pages = new Pages(gm.getName());
        Page page = pages.getPage(new Integer(pageId));
        if (page == null) {
            return null;
        } else {
            return page.getContent();
        }
    }

    @POST
    @Path("/{pageId : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    public void setPage(@PathParam("gameModelId") String gameModelId, @PathParam("pageId") String pageId, JSONObject content) throws RepositoryException {
        GameModel gm = gmFacade.find(new Long(gameModelId));
        Pages pages = new Pages(gm.getName());
        Page page = new Page(new Integer(pageId), content);
        pages.store(page);
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public void setPages(@PathParam("gameModelId") String gameModelId, JSONObject content) throws RepositoryException, JSONException {
        GameModel gm = gmFacade.find(new Long(gameModelId));
        Pages pages = new Pages(gm.getName());
        Iterator kIterator = content.keys();
        while(kIterator.hasNext()){
            String key = (String) kIterator.next();
            Page page = new Page(new Integer(key), content.getJSONObject(key));
            pages.store(page);
        }
    }
}
