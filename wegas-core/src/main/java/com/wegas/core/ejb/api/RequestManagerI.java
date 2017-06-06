package com.wegas.core.ejb.api;

import com.wegas.core.persistence.BroadcastTarget;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.persistence.User;
import java.util.Locale;

public interface RequestManagerI {

    void commit(Player player, boolean clear);

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
     *
     * @param token token to lock
     */
    void lock(String token);

    /**
     *
     * @param token  token to lock
     * @param target scope to inform about the lock
     */
    void lock(String token, BroadcastTarget target);

    /**
     * @param millis
     */
    void pleaseWait(long millis);

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
    boolean tryLock(String token, BroadcastTarget target);

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
    void unlock(String token, BroadcastTarget target);

    boolean isTestEnv();

}
