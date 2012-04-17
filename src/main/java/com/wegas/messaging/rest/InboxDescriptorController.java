/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.messaging.rest;

import com.wegas.core.rest.AbstractRestController;
import com.wegas.messaging.ejb.InboxDescriptorFacade;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/InboxDescriptor/")
public class InboxDescriptorController extends AbstractRestController<InboxDescriptorFacade> {
    /*
     *
     */

    @EJB
    private InboxDescriptorFacade inboxDescriptorFacade;

    /**
     *
     * @return
     */
    @Override
    protected InboxDescriptorFacade getFacade() {
        return this.inboxDescriptorFacade;
    }
}
