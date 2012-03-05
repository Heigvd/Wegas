/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.rest;

import com.wegas.ejb.GameModelEntityFacade;
import com.wegas.ejb.VariableDescriptorEntityFacade;
import com.wegas.persistence.game.AbstractEntity;
import com.wegas.persistence.game.GameModelEntity;
import com.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import java.util.Collection;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor")
public class VariableDescriptorController extends AbstractRestController<VariableDescriptorEntityFacade> {

    private static final Logger logger = Logger.getLogger("Authoring_GM_VariableDescriptor");
    /**
     *
     */
    @EJB
    private VariableDescriptorEntityFacade variableDescriptorFacade;
    /**
     *
     */
    @EJB
    private GameModelEntityFacade gameModelFacade;
    /**
     *
     */
    @Context
    private UriInfo uriInfo;

    /**
     *
     * @return
     */
    @Override
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<AbstractEntity> index() {
        System.out.println("*" + gameModelFacade + "*" + uriInfo);
        Long gameModelId = this.getGameModelId();
        GameModelEntity gameModel = gameModelFacade.find(gameModelId);
        return (Collection) gameModel.getVariableDescriptors();
    }

    /**
     * Resets all the variables of a given game model
     *
     * @param gameModelId game model id
     * @return OK
     */
    @GET
    @Path("reset")
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<VariableDescriptorEntity> reset(@PathParam("gameModelId") Long gameModelId) {
        return gameModelFacade.reset(gameModelId).getVariableDescriptors();
    }

    private Long getGameModelId() {
        return new Long(this.uriInfo.getPathParameters().get("gameModelId").get(0));
    }

    /**
     * 
     * @return
     */
    @Override
    protected VariableDescriptorEntityFacade getFacade() {
        return this.variableDescriptorFacade;
    }
}
