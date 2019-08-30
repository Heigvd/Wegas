/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.log.neo4j.Neo4jPlayerReply;
import javax.inject.Inject;
import javax.persistence.PostUpdate;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class NumberListener {

    @Inject
    private RequestManager requestManager;

    @Inject
    private Neo4jPlayerReply neo4jPlayerReply;

    /**
     * @param number received from EntityListener
     */
    @PostUpdate
    public void change(Object number) {
        if (number instanceof NumberInstance) {
            NumberInstance n = (NumberInstance) number;
            if (n.getScope() != null) {
                neo4jPlayerReply.onNumberUpdate(new NumberUpdate(requestManager.getPlayer(), n));
            }
        }
    }

    public static class NumberUpdate {

        final public Player player;

        final public NumberInstance number;

        NumberUpdate(Player player, NumberInstance number) {
            this.number = number;
            this.player = player;
        }
    }
}
