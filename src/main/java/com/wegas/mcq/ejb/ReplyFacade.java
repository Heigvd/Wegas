/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.mcq.ejb;

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.mcq.persistence.Reply;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class ReplyFacade extends AbstractFacadeImpl<Reply> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public ReplyFacade() {
        super(Reply.class);
    }


    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }
}
