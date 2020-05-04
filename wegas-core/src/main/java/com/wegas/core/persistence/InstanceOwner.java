/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.WegasPermission;
import java.util.ArrayList;
import java.util.List;

/**
 * Defined some method related to instances owners
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface InstanceOwner extends WithId {

    /**
     *
     * Pusher channel to use for this owner
     *
     * @return instance owner pusher channel
     */
    String getChannel();

    /**
     * Fetch all players involved
     *
     * @return all players who have write access to the owner instances
     */
    List<Player> getPlayers();

    /**
     *
     * @return all LIVE players who have write access to the owner instances
     */
    @JsonIgnore
    default List<Player> getLivePlayers() {
        List<Player> players = this.getPlayers();
        List<Player> lives = new ArrayList<>(players.size());
        for (Player p : players) {
            if (p.getStatus().equals(Status.LIVE)) {
                lives.add(p);
            }
        }

        return lives;
    }

    /**
     * Find a player owned by the given user
     *
     * @param user
     * @return a live player linked to the user or null
     */
    @JsonIgnore
    Player getUserLivePlayer(User user);

    /**
     *
     * @param user
     *
     * @return
     */
    default Player getUserLivePlayerOrDebugPlayer(User user) {
        Player p = this.getUserLivePlayer(user);
        if (p == null) {
            p = this.getGameModel().getTestPlayer();
        }

        return p;
    }

    /**
     * Get any player involved
     *
     * @return a (LIVE) player who have access to all owner's instances
     */
    @JsonIgnore
    Player getAnyLivePlayer();

    @JsonIgnore
    Player getTestPlayer();

    /**
     * Return instances that belongs to this target only
     *
     * @return instances that belongs to this target only
     */
    @JsonIgnore
    List<VariableInstance> getPrivateInstances();

    /**
     * return instances that belongs to this target and its children
     *
     * @return instances that belongs to this target and its children
     */
    @JsonIgnore
    List<VariableInstance> getAllInstances();

    /**
     * The permission which require read right to this instanceOwner
     *
     * @return
     */
    @JsonIgnore
    WegasPermission getAssociatedReadPermission();

    /**
     * The permission to grant to give write right to this instanceOwner
     *
     * @return
     */
    @JsonIgnore
    WegasPermission getAssociatedWritePermission();

    /**
     * 
     * @return 
     */
    //@JsonIgnore /* Do not JsonIgnore here as Game must serialize the gameModel (Lobby case) */
    GameModel getGameModel();
}
