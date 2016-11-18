/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.internal.DelayedEventPayload;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Resource;
import javax.ejb.*;
import javax.inject.Inject;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
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

    @Timeout
    public void timeout(Timer timer) {
        Serializable info = timer.getInfo();
        if (info instanceof DelayedEventPayload) {
            RequestManager rm = requestFacade.getRequestManager();
            rm.setEnv(RequestManager.RequestEnvironment.INTERNAL);
            DelayedEventPayload payload = (DelayedEventPayload) info;
            rm.setMethod("DELAYED EVENT");
            rm.setPath(payload.getEventName());
            Player p = playerFacade.find(payload.getPlayerId());

            // fire Script (ie base mechanism and static server script eval)
            scriptEventFacade.fire(p, payload.getEventName());
            // force FSM evaluation and make sur EntityManager has flush
            requestFacade.commit(p, true);

            rm.markManagermentStartTime();
            /*
             * ManagedModeResponseFilter mock-up.
             * To propagate instances through websockets
             */
            Map<String, List<AbstractEntity>> updatedEntities = requestFacade.getUpdatedEntities();
            Map<String, List<AbstractEntity>> destroyedEntities = requestFacade.getDestroyedEntities();
            Map<String, List<AbstractEntity>> outdatedEntities = requestFacade.getOutdatedEntities();

            if (!(updatedEntities.isEmpty() && destroyedEntities.isEmpty() && outdatedEntities.isEmpty())) {
                rm.markPropagationStartTime();
                websocketFacade.onRequestCommit(updatedEntities, destroyedEntities, outdatedEntities, null);
                rm.markPropagationEndTime();
            }
            rm.markSerialisationStartTime();
        } else {
            logger.error("UNREADABLE INFO");
        }
    }

    /**
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
            logger.warn("DelayedEvent skipped due to execution environnement (" + env + ")");
        }
    }
}
