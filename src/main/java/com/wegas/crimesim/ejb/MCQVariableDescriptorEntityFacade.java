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
import com.wegas.core.ejb.PlayerEntityFacade;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.core.script.ScriptEntity;
import com.wegas.crimesim.persistence.variable.MCQVariableDescriptorEntity;
import com.wegas.crimesim.persistence.variable.MCQReplyVariableDescriptorEntity;
import com.wegas.crimesim.persistence.variable.MCQVariableInstanceEntity;
import com.wegas.crimesim.persistence.variable.MCQReplyVariableInstanceEntity;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class MCQVariableDescriptorEntityFacade extends AbstractFacade<MCQVariableDescriptorEntity> {

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
    public MCQVariableDescriptorEntityFacade() {
        super(MCQVariableDescriptorEntity.class);
    }
}
