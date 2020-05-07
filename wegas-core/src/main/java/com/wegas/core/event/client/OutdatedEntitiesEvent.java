/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Yannick Lagger (lagger.yannick at gmail.com)
 */
public class OutdatedEntitiesEvent extends ClientEvent {

    private static final long serialVersionUID = 1L;

    private List<OutdatedEntity> outdated = new ArrayList<>();

    public static class OutdatedEntity {

        private String type;
        private Long id;

        public OutdatedEntity(AbstractEntity entity) {
            this.type = entity.getJSONClassName();
            this.id = entity.getId();
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

    }

    /**
     *
     */
    public OutdatedEntitiesEvent() {
        // ensure to have an empty constructor
    }

    public OutdatedEntitiesEvent(List<AbstractEntity> entities) {
        for (AbstractEntity entity : entities) {
            this.outdated.add(new OutdatedEntity(entity));
        }
    }

    /**
     * @return the updatedEntities
     */
    public List<OutdatedEntity> getUpdatedEntities() {
        return outdated;
    }

    /**
     * @param outdated
     */
    public void setUpdatedEntities(List<OutdatedEntity> outdated) {
        this.outdated = outdated;
    }

    /**
     *
     * @param entity
     */
    public void addEntity(AbstractEntity entity) {
        this.outdated.add(new OutdatedEntity(entity));
    }
}
