/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import ch.albasim.wegas.annotations.WegasCallback;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.Mergeable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class LifecycleCollector {

    private static final Logger logger = LoggerFactory.getLogger(LifecycleCollector.class);

    Map<String, CollectedEntity> deleted = new HashMap<>();
    Map<String, CollectedEntity> created = new HashMap<>();

    //  PARENT         IDENTIFIER, ORPHANS
    Map<Mergeable, Map<Object, OrphanContainer>> orphansMap = new HashMap<>();

    public Map<String, CollectedEntity> getDeleted() {
        return deleted;
    }

    public void adopt(Mergeable parent) {
        if (orphansMap.containsKey(parent)) {
            orphansMap.remove(parent);
        }
    }

    /**
     *
     * @param parent     used to be orphan parent
     * @param identifier parent property which contains orphans
     * @param orphans    orphans themselves
     */
    public void registerOrphans(Mergeable parent, Object identifier, Object orphans) {
        orphansMap.putIfAbsent(parent, new HashMap<>());
        Map<Object, OrphanContainer> parentOrphans = orphansMap.get(parent);

        parentOrphans.putIfAbsent(identifier, new OrphanContainer());

        OrphanContainer container = parentOrphans.get(identifier);
        if (orphans instanceof List) {
            container.addAll((List<Object>) orphans);
        } else if (orphans instanceof Map) {
            container.addAll((Map<Object, Object>) orphans);
        } else if (orphans instanceof Set) {
            container.addAll((List<Object>) orphans);
        } else {
            throw WegasErrorMessage.error("Unknown Type: " + orphans);
        }
    }

    public Map<Mergeable, Map<Object, OrphanContainer>> getCollectedOrphans() {
        return this.orphansMap;
    }

    public void setDeleted(Map<String, CollectedEntity> deleted) {
        this.deleted = deleted;
    }

    public Map<String, CollectedEntity> getCreated() {
        return created;
    }

    public void setCreated(Map<String, CollectedEntity> created) {
        this.created = created;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();

        sb.append(System.lineSeparator());
        sb.append("New Entities ").append(created.size()).append(":");
        sb.append(System.lineSeparator());
        for (Entry<String, CollectedEntity> entry : created.entrySet()) {
            sb.append(" * ").append(entry.getKey()).append(" ->").append(entry);
            sb.append(System.lineSeparator());
        }

        sb.append("Destroyed Entities ").append(deleted.size()).append(":");
        sb.append(System.lineSeparator());
        for (Entry<String, CollectedEntity> entry : deleted.entrySet()) {
            sb.append(" * ").append(entry.getKey()).append(" ->").append(entry);
            sb.append(System.lineSeparator());
        }

        sb.append("Orphans Entities ").append(orphansMap.size()).append(":");
        sb.append(System.lineSeparator());
        for (Entry<Mergeable, Map<Object, OrphanContainer>> entry : orphansMap.entrySet()) {
            sb.append(" Parent ").append(entry.getKey()).append(":").append(System.lineSeparator());
            for (Entry<Object, OrphanContainer> entry2 : entry.getValue().entrySet()) {
                sb.append("  * ").append(entry2.getKey()).append(" -> ").append(entry2.getValue()).append(System.lineSeparator());
            }
        }

        return sb.toString();
    }

    public static final class OrphanContainer {

        private List<Object> orphansList;
        private Map<Object, Object> orphansMap;

        public Object getOrphans() {
            return orphansList != null ? orphansList : orphansMap;
        }

        private void addAll(List<Object> list) {
            if (this.orphansList == null) {
                this.orphansList = new ArrayList<>();
            }
            this.orphansList.addAll(list);
        }

        private void addAll(Map<Object, Object> map) {
            if (this.orphansMap == null) {
                this.orphansMap = new HashMap<>();
            }
            this.orphansMap.putAll(map);
        }

        public Boolean areOrphansInstanceOf(Class<? extends Mergeable> klass) {
            if (orphansList != null && !orphansList.isEmpty()) {
                return klass.isAssignableFrom(orphansList.get(0).getClass());
            } else if (orphansMap != null && !orphansMap.isEmpty()) {
                return klass.isAssignableFrom(orphansMap.values().iterator().next().getClass());
            }
            return null;
        }

        @Override
        public String toString() {
            return "" + (orphansList != null ? orphansList : orphansMap);
        }
    }

    public static final class CollectedEntity {

        private Object parent;

        private Object identifier;

        private Mergeable entity;

        private Mergeable payload;

        List<WegasCallback> callbacks;

        public CollectedEntity(Mergeable entity, Mergeable payload, List<WegasCallback> callbacks,
                Object parent, Object identifier) {
            this.entity = entity;
            this.payload = payload;
            this.callbacks = callbacks;
            this.parent = parent;
            this.identifier = identifier;
        }

        public Mergeable getEntity() {
            return entity;
        }

        public void setEntity(Mergeable entity) {
            this.entity = entity;
        }

        public List<WegasCallback> getCallbacks() {
            return callbacks;
        }

        public void setCallbacks(List<WegasCallback> callbacks) {
            this.callbacks = callbacks;
        }

        public Mergeable getPayload() {
            return payload;
        }

        public void setPayload(Mergeable payload) {
            this.payload = payload;
        }

        public Object getParent() {
            return parent;
        }

        public void setParent(Object parent) {
            this.parent = parent;
        }

        public Object getIdentifier() {
            return identifier;
        }

        public void setIdentifier(Object identifier) {
            this.identifier = identifier;
        }

        @Override
        public String toString(){
            return parent + "::" + identifier + " -> " + entity;
        }
    }
}
