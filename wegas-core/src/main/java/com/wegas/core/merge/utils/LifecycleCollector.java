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
import java.util.Map;

/**
 *
 * @author maxence
 */
public class LifecycleCollector {

    Map<String, AbstractEntity> deleted = new HashMap<>();
    Map<String, AbstractEntity> created = new HashMap<>();

    public Map<String, AbstractEntity> getDeleted() {
        return deleted;
    }

    public void setDeleted(Map<String, AbstractEntity> deleted) {
        this.deleted = deleted;
    }

    public Map<String, AbstractEntity> getCreated() {
        return created;
    }

    public void setCreated(Map<String, AbstractEntity> created) {
        this.created = created;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();

        sb.append("\n");
        sb.append("New Entities ").append(created.size()).append(":");
        sb.append("\n");
        for (AbstractEntity entity : created.values()) {
            sb.append(" * ").append(entity.toString());
            sb.append("\n");
        }

        sb.append("Destroyed Entities ").append(deleted.size()).append(":");
        sb.append("\n");
        for (AbstractEntity entity : deleted.values()) {
            sb.append(" * ").append(entity.toString());
            sb.append("\n");
        }

        return sb.toString();
    }
}
