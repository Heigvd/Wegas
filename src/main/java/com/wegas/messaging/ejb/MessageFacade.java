/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.messaging.ejb;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.crimesim.persistence.variable.MCQReplyInstanceEntity;
import com.wegas.messaging.persistence.variable.MessageEntity;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class MessageFacade extends AbstractFacade<MessageEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public MessageFacade() {
        super(MessageEntity.class);
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
