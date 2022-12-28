/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.internal.DelayedEventPayload;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.util.ActAsPlayer;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Bean to fire delayed event within a brand new transaction
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class DelayedScriptEventFacadeTx {

    private static final Logger logger = LoggerFactory.getLogger(DelayedScriptEventFacade.class);

    @Inject
    private ScriptEventFacade scriptEventFacade;

    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private RequestFacade requestFacade;

    /**
     * @param payload
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public void fireEventTX(DelayedEventPayload payload) {

        Player p = playerFacade.find(payload.getPlayerId());
        RequestManager rm = requestFacade.getRequestManager();

        try ( ActAsPlayer a = rm.actAsPlayer(p)) {
            // fire Script (ie base mechanism and static server script eval)
            scriptEventFacade.fire(p, payload.getEventName());
            // force FSM evaluation and make sur EntityManager has flush
            requestFacade.commit(p);
            logger.warn("Checked");
        }
    }
}
