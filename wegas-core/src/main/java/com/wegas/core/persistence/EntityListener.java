 /*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.List;
import java.util.Map;
import javax.inject.Inject;
import javax.persistence.PostPersist;
import javax.persistence.PostUpdate;
import javax.persistence.PreRemove;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class EntityListener {

    private static final Logger logger = LoggerFactory.getLogger(EntityListener.class);

    @Inject
    private RequestManager requestManager;

    @PostPersist
    void onPostPersist(Object o) {
    //logger.error("POST PERSIST: " + o);
    }

    @PostUpdate
    void onPostUpdate(Object o) {
        if (o instanceof Broadcastable) {
            Broadcastable b = (Broadcastable) o;
            if (b instanceof GameModel) {
                requestManager.addOutofdateEntities(b.getEntities());
            } else if (b instanceof AbstractEntity) {
                Map<String, List<AbstractEntity>> entities = b.getEntities();
                requestManager.addUpdatedEntities(entities);
            }
        }
    }

    @PreRemove
    void onPreRemove(Object o) {
        if (o instanceof Broadcastable && (o instanceof VariableDescriptor
                || o instanceof GameModel
                || o instanceof Game
                || o instanceof Team
                || o instanceof Player)) {
            Broadcastable b = (Broadcastable) o;
            Map<String, List<AbstractEntity>> entities = b.getEntities();
            logger.error(("Entities: " + entities.size()));
            requestManager.addDestroyedEntities(entities);
        }
    }
}
