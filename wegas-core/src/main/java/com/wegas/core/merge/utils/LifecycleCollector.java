/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.persistence.AbstractEntity;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 *
 * @author maxence
 */
public class LifecycleCollector {

    Map<String, CollectedEntity> deleted = new HashMap<>();
    Map<String, CollectedEntity> created = new HashMap<>();

    public Map<String, CollectedEntity> getDeleted() {
        return deleted;
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

        sb.append("\n");
        sb.append("New Entities ").append(created.size()).append(":");
        sb.append("\n");
        for (CollectedEntity entity : created.values()) {
            sb.append(" * ").append(entity.getEntity().toString());
            sb.append("\n");
        }

        sb.append("Destroyed Entities ").append(deleted.size()).append(":");
        sb.append("\n");
        for (CollectedEntity entity : deleted.values()) {
            sb.append(" * ").append(entity.getEntity().toString());
            sb.append("\n");
        }

        return sb.toString();
    }

    public static final class CollectedEntity {

        private AbstractEntity entity;

        private AbstractEntity payload;

        List<WegasCallback> callbacks;

        public CollectedEntity(AbstractEntity entity, AbstractEntity payload, List<WegasCallback> callbacks) {
            this.entity = entity;
            this.payload = payload;
            this.callbacks = callbacks;
        }

        public AbstractEntity getEntity() {
            return entity;
        }

        public void setEntity(AbstractEntity entity) {
            this.entity = entity;
        }

        public List<WegasCallback> getCallbacks() {
            return callbacks;
        }

        public void setCallbacks(List<WegasCallback> callbacks) {
            this.callbacks = callbacks;
        }

        public AbstractEntity getPayload() {
            return payload;
        }

        public void setPayload(AbstractEntity payload) {
            this.payload = payload;
        }
    }
}
