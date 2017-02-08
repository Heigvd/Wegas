/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import javax.ejb.LocalBean;
import javax.ejb.Lock;
import javax.ejb.LockType;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Internal Mechanism
 *
 * PLEASE CONSIDER USING METHOD WITHIN REQUEST MANAGER
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Singleton
@LocalBean
@Startup
public class MutexSingleton {

    @Inject
    WebsocketFacade websocketFacade;

    public static class RefCounterLock {

        public int counter;
        public ReentrantLock sem;
        public String token;
        public String audience;

        public RefCounterLock(String token, String audience) {
            this.token = token;
            this.audience = audience;
            counter = 0;
            sem = new ReentrantLock(false); // true will favorize long-waiting threads
        }
    }

    private static final Logger logger = LoggerFactory.getLogger(MutexSingleton.class);

    Map<String, RefCounterLock> locks = new ConcurrentHashMap<>();

    public ReentrantLock _lock = new ReentrantLock();

    private String getEffectiveToken(String token, String audience) {
        if (audience != null && !audience.isEmpty()) {
            return audience + "::" + token;
        } else {
            return "internal::" + token;
        }
    }

    /**
     * Acquire the lock only if it's not held by another thread at invocation
     * time.
     *
     * THE CALLING THREAD WILL NEVER BEEING BLOCKED WITHIN THIS METHOD AND WILL
     * RETURN EVEN IF IT HAS NOT SUCCESSFULY ACQUIRED THE LOCK !!!
     *
     * @param token lock identifier
     * @return true if the lock has been successfully acquired, false otherwise
     */
    @Lock(LockType.READ)
    public boolean tryLock(String token, String audience) {
        String effectiveToken = getEffectiveToken(token, audience);
        //logger.error("try to lock " + token);

        RefCounterLock lock;
        boolean r = false;

        synchronized (this) {
            locks.putIfAbsent(effectiveToken, new RefCounterLock(token, audience));
            lock = locks.get(effectiveToken);

            if (lock.sem.tryLock()) {
                r = true; // Successful
                lock.counter++;

                if (audience != null && lock.counter == 1) { // just locked
                    websocketFacade.sendLock(audience, token);
                }
                /*} else if (lock.counter == 0) {
                // since the lock is held by another process, the counter is always (thanks to sync(this)) >= 1)
                locks.remove(token);*/
            }
        }
        return r;
    }

    /**
     * Acquire the lock only if it's not held by another thread.
     *
     * The method will return only when the lock will be held by the calling
     * thread.
     *
     * @param token lock identifier
     */
    @Lock(LockType.READ)
    public void lock(String token, String audience) {
        String effectiveToken = getEffectiveToken(token, audience);
        //logger.error("try to lock " + token);

        RefCounterLock lock;

        synchronized (this) {
            locks.putIfAbsent(effectiveToken, new RefCounterLock(token, audience));
            lock = locks.get(effectiveToken);
            lock.counter++;
            if (audience != null && lock.counter == 1) { //just locked
                {
                    websocketFacade.sendLock(audience, token);
                }
            }
        }
        lock.sem.lock();
        //logger.error("lock " + token + " acquired");
    }

    /**
     * Some internal method to cleanly unlock the lock
     *
     * @param lock  the lock to unlock
     * @param token lock identifier
     */
    private void unlock(RefCounterLock lock, String token, String audience) {
        String effectiveToken = getEffectiveToken(token, audience);
        lock.sem.unlock();
        lock.counter--;
        if (lock.counter == 0) {
            if (audience != null && !audience.equals("internal")) {
                websocketFacade.sendUnLock(audience, token);
            }
            locks.remove(effectiveToken);
            //logger.error("CLEAN LOCK LIST");
        }

    }

    /**
     * Unlock the lock once
     *
     * @param token lock identifier
     */
    @javax.ejb.Lock(LockType.READ)
    public void unlock(String token, String audience) {
        String effectiveToken = getEffectiveToken(token, audience);
        RefCounterLock lock = locks.getOrDefault(effectiveToken, null);
        if (lock != null) {
            synchronized (this) {
                this.unlock(lock, token, audience);
            }
        }
    }

    /**
     * Force to completely release the lock
     *
     * @param token lock identifier
     */
    @javax.ejb.Lock(LockType.READ)
    public void unlockFull(String token, String audience) {
        String effectiveToken = getEffectiveToken(token, audience);
        RefCounterLock lock = locks.getOrDefault(effectiveToken, null);
        if (lock != null) {
            synchronized (this) {
                while (lock.sem.getHoldCount() > 0) {
                    this.unlock(lock, token, audience);
                }
            }
        }
    }

    @javax.ejb.Lock(LockType.READ)
    public Collection<String> getTokensByAudiences(List<String> audiences) {
        Collection<String> tokens = new ArrayList<>();
        for (Entry<String, RefCounterLock> entry : this.locks.entrySet()) {
            if (audiences.contains(entry.getValue().audience)) {
                tokens.add(entry.getValue().token);
            }
        }
        return tokens;

    }

}
