/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.crimesim.ejb;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.crimesim.persistence.variable.MCQVariableDescriptorReplyEntity;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class MCQVariableDescriptorReplyEntityFacade extends AbstractFacade<MCQVariableDescriptorReplyEntity> {
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    /**
     *
     */
    public MCQVariableDescriptorReplyEntityFacade() {
        super(MCQVariableDescriptorReplyEntity.class);
    }

}
