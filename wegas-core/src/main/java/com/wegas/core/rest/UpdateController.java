/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import org.apache.shiro.authz.annotation.RequiresRoles;

/**
 *
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("Update")
@RequiresRoles("Administrator")
public class UpdateController {

    @EJB
    VariableDescriptorFacade descriptorFacade;
    @EJB
    GameModelFacade gameModelFacade;

    @GET
    public String index() {
        String ret = "";
        for (GameModel gm : gameModelFacade.findAll()) {
            ret += "<a href=\"Encode/" + gm.getId() + "\">Update variable names " + gm.getId() + "</a> | ";
            ret += "<a href=\"UpdateScript/" + gm.getId() + "\">Update script " + gm.getId() + "</a><br />";
        }
        return ret;
    }

    /**
     * Retrieve
     *
     * @param req
     * @return
     * @throws IOException
     */
    @GET
    @Path("Encode/{gameModelId : ([1-9][0-9]*)}")
    public String encode(@PathParam("gameModelId") Long gameModelId) {
        List<VariableDescriptor> findAll = descriptorFacade.findByGameModelId(gameModelId);
        for (VariableDescriptor vd : findAll) {
            vd.setName(Helper.encodeVariableName(vd.getName()));
            descriptorFacade.checkNameAndLabelAvailability(vd);
            descriptorFacade.flush();
        }
        return "Finished";
    }

    @GET
    @Path("UpdateScript/{gameModelId : ([1-9][0-9]*)}")
    public String script(@PathParam("gameModelId") Long gameModelId) {
        List<VariableDescriptor> findAll = descriptorFacade.findAll(gameModelId);
        for (VariableDescriptor vd : findAll) {
            vd.setName(Helper.encodeVariableName(vd.getName()));
            descriptorFacade.checkNameAndLabelAvailability(vd);
        }
        return "Finished";
    }
}
