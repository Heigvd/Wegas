/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
import java.util.Map;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface Broadcastable {

    /**
     * get all entities that should be propagated when this has been
     * created/updated/deleted, sorted by audience
     *
     * key identifier may be: private-GameModel-ID, private-Game-ID, private-Team-ID or
     * private-Player-ID
     *
     * @return map of touched entities
     */
    @JsonIgnore
    Map<String, List<AbstractEntity>> getEntities();
}
