/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.api.DelayedScriptEventFacadeI;
import com.wegas.core.event.internal.DelayedEventPayload;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import java.io.Serializable;
import java.util.List;
import java.util.Map;
import javax.annotation.Resource;
import javax.ejb.*;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Singleton
@LocalBean
public class DelayedScriptEventFacade implements DelayedScriptEventFacadeI {

    private static final Logger logger = LoggerFactory.getLogger(DelayedScriptEventFacade.class);

    @Resource
    private TimerService timerService;

    @Inject
    private ScriptEventFacade scriptEventFacade;

    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private RequestFacade requestFacade;

    @Inject
    private WebsocketFacade websocketFacade;

    @Timeout
    public void timeout(Timer timer) {
        Serializable info = timer.getInfo();
        if (info instanceof DelayedEventPayload) {
            DelayedEventPayload payload = (DelayedEventPayload) info;
            RequestManager rm = requestFacade.getRequestManager();
            rm.su(payload.getAccountId());
            try {

                rm.setEnv(RequestManager.RequestEnvironment.INTERNAL);
                rm.setMethod("DELAYED EVENT");
                rm.setPath(payload.getEventName());
                Player p = playerFacade.find(payload.getPlayerId());

                // fire Script (ie base mechanism and static server script eval)
                scriptEventFacade.fire(p, payload.getEventName());
                // force FSM evaluation and make sur EntityManager has flush
                requestFacade.commit(p);

                rm.markManagermentStartTime();
                /*
             * ManagedModeResponseFilter mock-up.
             * To propagate instances through websockets
                 */
                Map<String, List<AbstractEntity>> updatedEntities = rm.getMappedUpdatedEntities();
                Map<String, List<AbstractEntity>> destroyedEntities = rm.getMappedDestroyedEntities();

                if (!(updatedEntities.isEmpty() && destroyedEntities.isEmpty())) {
                    rm.markPropagationStartTime();
                    websocketFacade.onRequestCommit(updatedEntities, destroyedEntities, null);
                    rm.markPropagationEndTime();
                }
                rm.markSerialisationStartTime();
            } finally {
                rm.releaseSu();
            }
        } else {
            logger.error("UNREADABLE INFO");
        }
    }

    /**
     * @param minutes
     * @param seconds   [s]
     * @param eventName event to fire
     */
    @Override
    public void delayedFire(long minutes, long seconds, String eventName) {
        RequestManager requestManager = requestFacade.getRequestManager();
        RequestManager.RequestEnvironment env = requestManager.getEnv();
        if (env == RequestManager.RequestEnvironment.STD) {
            // Using second will prevent too short timer (not very usefull and may stress up the server...)
            long duration = (minutes * 60 + seconds) * 1000;
            try {
                timerService.createTimer(duration, new DelayedEventPayload(requestFacade.getPlayer().getId(),
                        requestManager.getCurrentUser().getMainAccount().getId(), eventName));
            } catch (IllegalArgumentException ex) {
                throw WegasErrorMessage.error("Timer duration is not valid");
            }
        } else {
            logger.warn("DelayedEvent skipped due to execution environnement ({})", env);
        }
    }
}
