/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.internal.DelayedEventPayload;
import com.wegas.core.event.internal.PlayerAction;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import java.io.Serializable;
import java.util.List;
import java.util.Map;
import javax.annotation.Resource;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Singleton;
import javax.ejb.Timeout;
import javax.ejb.Timer;
import javax.ejb.TimerService;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.script.ScriptEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Singleton
@LocalBean
public class DelayedScriptEventFacade {

    private static final Logger logger = LoggerFactory.getLogger(DelayedScriptEventFacade.class);

    @Resource
    private TimerService timerService;

    @Inject
    private ScriptEventFacade scriptEventFacade;

    @EJB
    private PlayerFacade playerFacade;

    @EJB
    private RequestFacade requestFacade;

    @EJB
    private WebsocketFacade websocketFacade;

    @Inject
    private Event<PlayerAction> playerActionEvent;

    @Timeout
    public void timeout(Timer timer) {
        Serializable info = timer.getInfo();
        if (info instanceof DelayedEventPayload) {
            requestFacade.getRequestManager().setEnv(RequestManager.RequestEnvironment.INTERNAL);
            DelayedEventPayload payload = (DelayedEventPayload) info;
            Player p = playerFacade.find(payload.getPlayerId());

            // fire Script (ie base mechanism and static server script eval)
            scriptEventFacade.fire(p, payload.getEventName());
            // force FSM evaluation
            playerActionEvent.fire(new PlayerAction(p));

            Map<String, List<AbstractEntity>> updatedEntities = requestFacade.getUpdatedEntities();
            Map<String, List<AbstractEntity>> destroyedEntities = requestFacade.getDestroyedEntities();
            Map<String, List<AbstractEntity>> outdatedEntities = requestFacade.getOutdatedEntities();

            if (!(updatedEntities.isEmpty() && destroyedEntities.isEmpty() && outdatedEntities.isEmpty())) {
                try {
                    websocketFacade.onRequestCommit(updatedEntities, destroyedEntities, outdatedEntities, null);
                } catch (NoPlayerException ex) {
                    logger.error("This shall never happen");
                }
            }
        } else {
            logger.error("UNREADABLE INFO");
        }
    }

    /**
     *
     * @param minutes
     * @param seconds   [s]
     * @param eventName event to fire
     */
    public void delayedFire(long minutes, long seconds, String eventName) {
        RequestManager.RequestEnvironment env = requestFacade.getRequestManager().getEnv();
        if (env == RequestManager.RequestEnvironment.STD) {
            // Using second will prevent too short timer (not very usefull and may stress up the server...)
            long duration = (minutes * 60 + seconds) * 1000;
            try {
                timerService.createTimer(duration, new DelayedEventPayload(requestFacade.getPlayer().getId(), eventName));
            } catch (IllegalArgumentException ex) {
                throw WegasErrorMessage.error("Timer duration is not valid");
            }
        } else {
            logger.info("DelayedEvent skipped due to execution environnement (" + env + ")");
        }
    }
}
