/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.core.persistence;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.primitive.NumberInstance;

import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.persistence.PostUpdate;

/**
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class NumberListener {

    @Inject
    private Event<NumberUpdate> updatedNumber;

    /**
     * @param number received from EntityListener
     */
    @PostUpdate
    public void change(Object number) {
        if (number instanceof NumberInstance) {
            NumberInstance n = (NumberInstance) number;
            if (n.getScope() != null) {
                updatedNumber.fire(new NumberUpdate(RequestFacade.lookup().getRequestManager().getPlayer(), n));
            }
        }
    }

    public class NumberUpdate {

        final public Player player;

        final public NumberInstance number;

        NumberUpdate(Player player, NumberInstance number) {
            this.number = number;
            this.player = player;
        }
    }
}
