/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Yannick Lagger <lagger.yannick at gmail.com>
 */
public class OutdatedEntitiesEvent extends ClientEvent {

    public class OutdatedEntity {

        private String type;
        private Long id;

        public OutdatedEntity(AbstractEntity entity) {
            this.type = entity.getClass().getSimpleName();
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

    private static final long serialVersionUID = 1L;
    private List<OutdatedEntity> outdated = new ArrayList<>();

    /**
     *
     */
    public OutdatedEntitiesEvent() {
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
