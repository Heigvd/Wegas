/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ILock;
import com.wegas.core.Helper;
import java.io.Serializable;
import javax.ejb.LocalBean;
import javax.cache.Cache;
import javax.ejb.Stateless;
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
//@Singleton
@Stateless
@LocalBean
//@Startup
public class ConcurrentHelper {

    private static final Logger logger = LoggerFactory.getLogger(ConcurrentHelper.class);

    private static final HazelcastInstance hazelcastInstance = Helper.getHazelcastInstance();
    private final ILock mainLock = hazelcastInstance.getLock("ConcurrentHelper.lock");

    @Inject
    private Cache<String, RefCounterLock> locks;

    public static class RefCounterLock implements Serializable {

        //HazelcastInstance instance;
        //ILock lock = instance.getLock("token");
        private static final long serialVersionUID = -5239056583611653597L;

        public int counter;
        public String token;

        public RefCounterLock(String lockName) {
            this.token = lockName;
            counter = 0;
        }

        public ILock getLock() {
            return hazelcastInstance.getLock(token);
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
    //@Lock(LockType.READ)
    public boolean tryLock(String token) {
        boolean r = false;
        mainLock.lock();

        try {
            //logger.error("try to lock " + token);
            RefCounterLock lock;

            //synchronized (this) {
            locks.putIfAbsent(token, new RefCounterLock(token));
            lock = locks.get(token);

            if (lock.getLock().tryLock()) {
                r = true; // Successful
                lock.counter++;
                /*} else if (lock.counter == 0) {
                // since the lock is held by another process, the counter is always (thanks to sync(this)) >= 1)
                locks.remove(token);*/
            }
            //}
        } finally {
            mainLock.unlock();
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
    //@Lock(LockType.READ)
    public void lock(String token) {
        RefCounterLock lock;
        mainLock.lock();

        //logger.error("try to lock " + token);
        try {
            //synchronized (this) {
            locks.putIfAbsent(token, new RefCounterLock(token));
            lock = locks.get(token);
            lock.counter++;
            //}
        } finally {
            mainLock.unlock();
        }

        lock.getLock().lock();
        //logger.error("lock " + token + " acquired");
    }

    /**
     * Some internal method to cleanly unlock the lock
     *
     * @param lock  the lock to unlock
     * @param token lock identifier
     */
    private void unlock(RefCounterLock lock, String token) {
        lock.getLock().unlock();
        lock.counter--;
        if (lock.counter == 0) {
            lock.getLock().destroy();
            locks.remove(token);
            //logger.error("CLEAN LOCK LIST");
        }

    }

    /**
     * Unlock the lock once
     *
     * @param token lock identifier
     */
    //@javax.ejb.Lock(LockType.READ)
    public void unlock(String token) {
        mainLock.lock();
        try {
            //logger.error("unlock " + token);
            RefCounterLock lock = locks.get(token);
            //RefCounterLock lock = locks.getOrDefault(token, null);
            if (lock != null) {
                //synchronized (this) {
                this.unlock(lock, token);
                //}
            }
        } finally {
            mainLock.unlock();
        }
    }

    /**
     * Force to completely release the lock
     *
     * @param token lock identifier
     */
    //@javax.ejb.Lock(LockType.READ)
    public void unlockFull(String token) {
        mainLock.lock();
        try {
            RefCounterLock lock = locks.get(token);
            //RefCounterLock lock = locks.getOrDefault(token, null);
            if (lock != null) {
                while (lock.getLock().isLockedByCurrentThread()) {
                    //while (lock.sem.getHoldCount() > 0) {
                    this.unlock(lock, token);
                }
            }
        } finally {
            mainLock.unlock();
        }
    }
}
