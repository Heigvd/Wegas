/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.persistence.User;
import java.util.Locale;

public interface RequestManagerI {

    void commit(Player player);

    void commit();

    /**
     * @return the local
     */
    Locale getLocale();

    /**
     * @param local the local to set
     */
    void setLocale(Locale local);

    User getCurrentUser();

    /**
     * @return the currentPlayer
     */
    Player getPlayer();

    /**
     * Check if the currentUser can write the gameModel
     *
     * @param gameModel the gameModel to check rights against
     *
     * @return true if the current user can edit the gameModel
     *
     */
    boolean hasGameModelWriteRight(final GameModel gameModel);

    /**
     * Check if the currentUser can write the game
     *
     * @param game the game to check rights against
     *
     * @return true if the current user can edit the game
     */
    boolean hasGameWriteRight(final Game game);

    /**
     * check if currentUser has the role
     *
     * @param roleName name of the role
     *
     * @return true if current user is member of the role
     */
    boolean hasRole(String roleName);

    /**
     *
     * @param token token to lock
     */
    void lock(String token);

    /**
     *
     * @param token  token to lock
     * @param target scope to inform about the lock
     */
    void lock(String token, InstanceOwner target);

    /**
     * @param millis
     *
     * @throws java.lang.InterruptedException
     */
    void pleaseWait(long millis) throws InterruptedException;

    /**
     * Method used to send custom events
     *
     * @param type    event name
     * @param payload object associated with that event
     */
    void sendCustomEvent(String type, Object payload);

    /**
     * Try to Lock the token. Non-blocking. Return true if token has been
     * locked, false otherwise
     *
     * @param token
     *
     * @return
     */
    boolean tryLock(String token);

    /**
     *
     * @param token  token to tryLock
     * @param target scope to inform about the lock
     *
     * @return
     */
    boolean tryLock(String token, InstanceOwner target);

    /**
     *
     * @param token token to release
     */
    void unlock(String token);

    /**
     *
     * @param token  token to release
     * @param target scope to inform about the lock
     */
    void unlock(String token, InstanceOwner target);

    /**
     *
     * @return
     */
    boolean isTestEnv();

}
