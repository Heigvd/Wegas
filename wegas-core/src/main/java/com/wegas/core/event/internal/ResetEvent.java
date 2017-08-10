/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.internal;

import com.wegas.core.persistence.game.Player;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import com.wegas.core.persistence.InstanceOwner;

/**
 *
 * Reset event can be bound to a specific context:
 * <ul>
 * <li>GameModel: reset everything</li>
 * <li>Game: do not reset gameModel scoped variables and also skip game scoped
 * instance belonging to others game</li>
 * <li>Team: do not reset gameModel and game scoped variables and also skip team
 * scoped instance belonging to others teams</li>
 * <li>Player: Only reset player scoped variables belonging to the placer</li>
 * </ul>
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class ResetEvent implements Serializable {

    private static final long serialVersionUID = -837744356172473317L;
    private boolean clear;

    private InstanceOwner context;

    public ResetEvent() {
    }

    /**
     *
     * @param context
     * @param clear
     */
    public ResetEvent(InstanceOwner context, boolean clear) {
        this.context = context;
        this.clear = clear;
    }

    /**
     *
     * @return this reset event context
     */
    public InstanceOwner getContext() {
        return context;
    }

    /**
     *
     * @return all players touched by this event context
     */
    public List<Player> getConcernedPlayers() {
        if (context != null) {
            return context.getPlayers();
        } else {
            return new ArrayList<>();
        }
    }

    public boolean isClear() {
        return clear;
    }

    public void setClear(boolean clear) {
        this.clear = clear;
    }
}
