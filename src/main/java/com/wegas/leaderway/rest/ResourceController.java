/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.leaderway.rest;

import com.wegas.core.rest.AbstractRestController;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.Reply;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.script.ScriptException;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/ResourceDescriptor/")
public class ResourceController extends AbstractRestController<QuestionDescriptorFacade> {

    /**
     *
     */
    @EJB
    private QuestionDescriptorFacade questionDescriptorFacade;

   
    /**
     *
     * @return
     */
    @Override
    protected QuestionDescriptorFacade getFacade() {
        return this.questionDescriptorFacade;
    }
}
