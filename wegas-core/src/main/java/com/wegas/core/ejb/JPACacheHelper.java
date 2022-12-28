/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.client.DestroyedEntity;
import fish.payara.micro.cdi.Inbound;
import fish.payara.micro.cdi.Outbound;
import java.util.ArrayList;
import java.util.stream.Collectors;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.persistence.Cache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class JPACacheHelper {

    private static final Logger logger = LoggerFactory.getLogger(JPACacheHelper.class);

    public static final String CLEAR_CACHE_EVENT_NAME = "ClearEmCache";
    public static final String EVICT_ENTITIES_EVENT_NAME = "EvictEntities";

    @Inject
    @Outbound(eventName = JPACacheHelper.CLEAR_CACHE_EVENT_NAME, loopBack = true)
    private Event<String> messages;

    /**
     * Note: payload must be serialisable. (but using an ArrayList does not work...)
     */
    @Inject
    @Outbound(eventName = JPACacheHelper.EVICT_ENTITIES_EVENT_NAME, loopBack = true)
    private Event<DestroyedEntity[]> evictEntities;

    @Inject
    private RequestManager requestManager;

    @Inject
    private ScriptFacade scriptFacade;

    public void requestClearCache() {
        messages.fire("all");
    }

    public void requestClearServerScriptCache() {
        messages.fire("serverScript");
    }

    public void clearCache(@Observes @Inbound(eventName = CLEAR_CACHE_EVENT_NAME) String event) {
        this.clearCacheLocal(event);
    }

    public void clearCacheLocal(String event) {
        if ("all".equals(event)){
            this.getCache().evictAll();
            scriptFacade.clearCache();
        } else if ("serverScript".equals(event)){
            scriptFacade.clearCache();
        }
    }

    private Cache getCache() {
        return requestManager.getEntityManager().getEntityManagerFactory().getCache();
    }

    public void evictEntities(@Observes @Inbound(eventName = EVICT_ENTITIES_EVENT_NAME) DestroyedEntity[] entities) {
        Cache cache = getCache();
        for (DestroyedEntity entity : entities) {
            try {
                Class<?> klass = Class.forName(entity.getClassName());
                logger.trace("Evict {}:{} from second level cache", klass.getSimpleName(), entity.getId());
                cache.evict(klass, entity.getId());
            } catch (ClassNotFoundException ex) {
                logger.error("Class Not found: {}", entity.getClassName());
            }
        }
    }

    /**
     * Request all instances in the cluster to evict current requestManager updatedEntity from second level cache
     */
    public void evictUpdatedEntities() {
        ArrayList<DestroyedEntity> entities = (ArrayList<DestroyedEntity>) requestManager.getAllUpdatedEntities().stream()
                .map(DestroyedEntity::new).collect(Collectors.toList());

        evictEntities.fire(entities.toArray(new DestroyedEntity[entities.size()]));
    }

    public void evictUpdatedEntitiesLocalOnly() {
        ArrayList<DestroyedEntity> entities = (ArrayList<DestroyedEntity>) requestManager.getAllUpdatedEntities().stream()
                .map(DestroyedEntity::new).collect(Collectors.toList());

        this.evictEntities(entities.toArray(new DestroyedEntity[entities.size()]));
    }
}
