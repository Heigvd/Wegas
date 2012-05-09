/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.GameModelFacadeBean;
import com.wegas.core.persistence.layout.WidgetEntity;
import java.util.List;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel")
public class GameModelController extends AbstractRestController<GameModelFacadeBean> {

    private static final Logger logger = Logger.getLogger("Authoring_GM");
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     *
     * @return
     */
    @Override
    protected GameModelFacadeBean getFacade() {
        return (GameModelFacadeBean)gameModelFacade;
    }

    /**
     *
     * @param gameModelId
     * @return
     */
    @GET
    @Path("{gameModelId : [1-9][0-9]*}/Widget/")
    @Produces(MediaType.APPLICATION_JSON)
    public List<WidgetEntity> getWidgets(
            @PathParam("gameModelId") Long gameModelId) {

        return gameModelFacade.find(gameModelId).getWidgets();
    }
}
