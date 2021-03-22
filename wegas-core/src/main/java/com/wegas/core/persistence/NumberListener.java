/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.log.xapi.Xapi;
import javax.inject.Inject;
import javax.persistence.PostPersist;
import javax.persistence.PostUpdate;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class NumberListener {

    @Inject
    private Xapi xapi;

    /**
     * @param number received from EntityListener
     */
    @PostPersist
    public void createInstance(Object number) {
        if (number instanceof NumberInstance) {
            NumberInstance n = (NumberInstance) number;
            if (n.getScope() != null) {
                xapi.postAuthorNumberInstance(n);
            }
        }
    }



    /**
     * @param number received from EntityListener
     */
    @PostUpdate
    public void change(Object number) {
        if (number instanceof NumberInstance) {
            NumberInstance n = (NumberInstance) number;
            if (n.getScope() != null) {
                xapi.postAuthorNumberInstance(n);
            }
        }
    }

    public static class NumberUpdate {

        final public Player player;

        final public NumberInstance number;

        /* package */ NumberUpdate(Player player, NumberInstance number) {
            this.number = number;
            this.player = player;
        }
    }
}
