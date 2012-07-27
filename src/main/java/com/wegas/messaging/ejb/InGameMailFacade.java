/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.messaging.ejb;

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.messaging.persistence.variable.InboxInstance;
import com.wegas.messaging.persistence.variable.Message;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class InGameMailFacade extends AbstractFacadeImpl<Message> {

    final static private Logger logger = LoggerFactory.getLogger(InGameMailFacade.class);
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     */
    public InGameMailFacade() {
        super(Message.class);
    }

    /**
     *
     * @param messageEvent
     */
    public void listener(@Observes MessageEvent messageEvent) {
        logger.info("Message received for player {}.", messageEvent.getPlayer());
        this.send(messageEvent.getPlayer(), messageEvent.getMessage());
    }

    /**
     *
     * @param p
     * @param msg
     */
    public void send(Player p, Message msg) {
        VariableDescriptor vd = variableDescriptorFacade.findByName(p.getGameModel(), "inbox");
        InboxInstance inbox = (InboxInstance) vd.getInstance(p);
        inbox.addMessage(msg);
    }

    /**
     *
     * @param p
     * @param subject
     * @param body
     * @param from
     */
    public void send(Player p, String subject, String body, String from) {
        Message msg = new Message();
        msg.setName(subject);
        msg.setBody(body);
        msg.setFrom(from);
        this.send(p, msg);
    }

    @Override
    protected EntityManager getEntityManager() {
        return this.em;
    }
}
