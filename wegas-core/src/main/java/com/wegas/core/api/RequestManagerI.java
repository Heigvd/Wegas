/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
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

    /**
     * Request state machines evaluation
     *
     * @param player
     */
    void commit(Player player);

    /**
     * Request state machines evaluation for the current player
     */
    void commit();

    /**
     * @return the locale
     */
    Locale getLocale();

    /**
     * @param local the local to set
     */
    void setLocale(Locale local);

    /**
     * get the current user
     *
     * @return current user
     */
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
     * Check if the currentUser can translate at least one language of the gameModel
     *
     * @param gameModel the gameModel to check rights against
     *
     * @return true if the current user can translate the gameModel
     *
     */
    boolean hasGameModelTranslateRight(final GameModel gameModel);

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
     * Shortcut to sendCustomEvent("notificationEvent", payload);
     * <p>
     * @param payload {content: "the message", timeout : 0}
     */
    void sendNotification(Object payload);

    /**
     * Try to Lock the token. Non-blocking. Return true if token has been
     * locked, false otherwise
     *
     * @param token
     *
     * @return true if token has been locked, false otherwise
     */
    boolean tryLock(String token);

    /**
     *
     * @param token  token to tryLock
     * @param target scope to inform about the lock
     *
     * @return true if token has been locked, false otherwise
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
     * Is test environment ?
     *
     * @return true if the current environment is TEST
     */
    boolean isTestEnv();

    /**
     * Get application based url
     *
     * @return app base url
     */
    String getBaseUrl();
}
