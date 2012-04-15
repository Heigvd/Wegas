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
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.script.ScriptEntity;
import com.wegas.crimesim.persistence.variable.MCQDescriptorEntity;
import com.wegas.crimesim.persistence.variable.MCQReplyDescriptorEntity;
import com.wegas.crimesim.persistence.variable.MCQInstanceEntity;
import com.wegas.crimesim.persistence.variable.MCQReplyInstanceEntity;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class MCQDescriptorFacade extends AbstractFacade<MCQDescriptorEntity> {

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
    public MCQDescriptorFacade() {
        super(MCQDescriptorEntity.class);
    }
}
