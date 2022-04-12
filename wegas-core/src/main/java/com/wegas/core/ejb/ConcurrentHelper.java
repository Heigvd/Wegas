/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.cp.lock.FencedLock;
import com.hazelcast.cp.lock.exception.LockOwnershipLostException;
import com.wegas.core.Helper;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import javax.cache.Cache;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Internal Mechanism
 * <p>
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

    private static final String MAIN_LOCK_NAME = "ConcurrentHelper.lock";

    // effectiveTokens
    private static final List<String> myLocks = new ArrayList<>();

    @Inject
    private Cache<String, RefCounterLock> locks;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private WebsocketFacade websocketFacade;

    public static class RefCounterLock implements Serializable {

        //HazelcastInstance instance;
        //ILock lock = instance.getLock("token");
        private static final long serialVersionUID = -5239056583611653597L;

        private int counter;
        private final String token;
        private final String audience;

        public RefCounterLock(String lockName, String audience) {
            this.token = lockName;
            this.audience = audience;
            counter = 0;
        }

        public int getCounter() {
            return counter;
        }

        public String getToken() {
            return token;
        }

        public String getAudience() {
            return audience;
        }

        @Override
        public String toString() {
            return "RefCounterLock(token: " + token + "; audience: " + audience + "; count: " + counter + ");";
        }
    }

    /**
     * Compute effective token according to token and audience.
     *
     * @param token
     * @param audience null means internal
     *
     * @return audience||internal :: token
     */
    private String getEffectiveToken(String token, String audience) {
        if (audience != null && !audience.isEmpty()) {
            return audience + "::" + token;
        } else {
            return "internal::" + token;
        }
    }

    /**
     * get effective lock
     *
     * @param lock
     *
     * @return
     */
    private FencedLock getLock(RefCounterLock lock) {
        String effectiveToken = getEffectiveToken(lock.token, lock.audience);
        logger.info("GET HZ LOCK {}", effectiveToken);
        return hzInstance.getCPSubsystem().getLock(effectiveToken);
    }

    /**
     * Helper is a cluster wide singleton. Lock it
     * <p>
     */
    private void mainLock() {
        hzInstance.getCPSubsystem().getLock(MAIN_LOCK_NAME).lock();
    }

    /**
     * Helper is a cluster wide singleton. Unlock it
     */
    private void mainUnlock() {
        hzInstance.getCPSubsystem().getLock(MAIN_LOCK_NAME).unlock();
    }

    /**
     * Acquire the lock only if it's not held by another thread at invocation time.
     * <p>
     * THE CALLING THREAD WILL NEVER BEEING BLOCKED WITHIN THIS METHOD AND WILL RETURN EVEN IF IT
     * HAS NOT SUCCESSFULY ACQUIRED THE LOCK !!!
     *
     * @param token    lock identifier
     * @param audience
     *
     * @return true if the lock has been successfully acquired, false otherwise
     */
    //@Lock(LockType.READ)
    public boolean tryLock(String token, String audience) {
        String effectiveToken = getEffectiveToken(token, audience);
        logger.info("try to lock \"{}\" as \"{}\"", token, effectiveToken);

        boolean r = false;
        this.mainLock();

        try {
            logger.info("try to lock \"{}\"", token);
            RefCounterLock lock;

            //synchronized (this) {
            locks.putIfAbsent(effectiveToken, new RefCounterLock(token, audience));
            lock = locks.get(effectiveToken);

            if (this.getLock(lock).tryLock()) {
                myLocks.add(effectiveToken);
                logger.info("MyLock TryLock:" + effectiveToken);
                logger.info("LOCKED: {}", lock);
                r = true; // Successful
                lock.counter++;
                locks.put(effectiveToken, lock);
                if (audience != null && lock.counter == 1) { // just locked
                    websocketFacade.sendLock(audience, token);
                }
                /* } else if (lock.counter == 0) { // since the lock is held by another process, the
                 * counter is always (thanks to sync(this)) >= 1) locks.remove(token); */
            }
            //}
        } finally {
            this.mainUnlock();
        }
        return r;
    }

    /**
     * Acquire the lock only if it's not held by another thread.
     * <p>
     * The method will return only when the lock will be held by the calling thread.
     *
     * @param token    lock identifier
     * @param audience
     */
    //@Lock(LockType.READ)
    public void lock(String token, String audience) {
        String effectiveToken = getEffectiveToken(token, audience);
        logger.info("LOCK \"{}\" for \"{}\"", token, audience);

        RefCounterLock lock;
        this.mainLock();

        logger.info("try to lock \"{}\"", token);
        try {
            //synchronized (this) {
            locks.putIfAbsent(effectiveToken, new RefCounterLock(token, audience));
            lock = locks.get(effectiveToken);
            lock.counter++;
            locks.put(effectiveToken, lock);
            logger.info("MyLock Lock:" + effectiveToken);
            myLocks.add(effectiveToken);
            logger.info("LOCKED: {}", lock);
            if (audience != null && lock.counter == 1) { //just locked
                websocketFacade.sendLock(audience, token);
            }
            //}
        } finally {
            this.mainUnlock();
        }

        this.getLock(lock).lock();
        logger.info("lock \"{}\" acquired", token);
    }

    /**
     * Some internal method to cleanly unlock the lock
     *
     * @param lock  the lock to unlock
     * @param token lock identifier
     */
    private void unlock(RefCounterLock lock, String token, String audience, boolean force) {
        String effectiveToken = getEffectiveToken(token, audience);
        logger.info("UNLOCK: {}", lock);
        FencedLock theLock = this.getLock(lock);
        try {
            if (force) {
                logger.info("UNLOCK FORCE (destroy): {}", lock);
                theLock.unlock();
            } else {
                logger.info("UNLOCK: {}", lock);
                theLock.unlock();
            }
        } catch (LockOwnershipLostException ex) {
            logger.error("Ownership exception: ", ex);
        } catch (IllegalMonitorStateException ex) {
            logger.error("Illegal Monitoring: ", ex);
        }

        logger.info("UNLOCKED");
        lock.counter--;
        logger.info("MyLock unlock:" + effectiveToken);
        myLocks.remove(effectiveToken);
        if (lock.counter == 0) {
            logger.info("UNLOCKED");
            if (!Helper.isNullOrEmpty(audience) && !audience.equals("internal")) {
                websocketFacade.sendUnLock(audience, token);
            }

            //this.getLock(lock).destroy();
            locks.remove(effectiveToken);

            logger.info("CLEAN LOCK LIST");
        } else {
            locks.put(effectiveToken, lock);
        }

    }

    /**
     * Unlock the lock once
     *
     * @param token lock identifier
     */
    //@javax.ejb.Lock(LockType.READ)
    public void unlock(String token, String audience, boolean force) {
        String effectiveToken = getEffectiveToken(token, audience);
        this.mainLock();
        try {
            logger.info("unlock {}", token);
            RefCounterLock lock = locks.get(effectiveToken);
            //RefCounterLock lock = locks.getOrDefault(token, null);
            if (lock != null) {
                //synchronized (this) {
                this.unlock(lock, token, audience, force);
                //}
            }
        } finally {
            this.mainUnlock();
        }
    }

    /**
     * Force to completely release the lock
     *
     * @param token    lock identifier
     * @param audience
     */
    //@javax.ejb.Lock(LockType.READ)
    public void unlockFull(String token, String audience, boolean force) {
        String effectiveToken = getEffectiveToken(token, audience);
        logger.info("UNLOCK FULL: \"{}\" for \"{}\"", token, audience);
        this.mainLock();
        try {
            RefCounterLock lock = locks.get(effectiveToken);
            logger.info("{} -> {}", effectiveToken, lock);
            //RefCounterLock lock = locks.getOrDefault(token, null);
            if (lock != null) {
                while (this.getLock(lock).isLockedByCurrentThread()) {
                    //while (lock.sem.getHoldCount() > 0) {
                    this.unlock(lock, token, audience, force);
                }
            }
        } finally {
            this.mainUnlock();
        }
    }

    /**
     * Returns all tokens locked own by any audience in the list
     *
     * @param audiences
     *
     * @return list of locked tokens
     */
    //@javax.ejb.Lock(LockType.READ)
    public Collection<String> getTokensByAudiences(List<String> audiences) {
        Collection<String> tokens = new ArrayList<>();
        Iterator<Cache.Entry<String, RefCounterLock>> iterator = this.locks.iterator();
        while (iterator.hasNext()) {
            Cache.Entry<String, RefCounterLock> entry = iterator.next();
            if (audiences.contains(entry.getValue().audience)) {
                tokens.add(entry.getValue().token);
            }
        }
        return tokens;

    }

    /**
     * Check lock cache integrity
     */
    public void gc() {
        Iterator<Cache.Entry<String, RefCounterLock>> iterator = this.locks.iterator();
        while (iterator.hasNext()) {
            Cache.Entry<String, RefCounterLock> entry = iterator.next();
            RefCounterLock value = entry.getValue();

            FencedLock lock = getLock(value);

            if (lock != null) {
                if (lock.isLocked()) {
                    iterator.remove();
                }
            } else {
                iterator.remove();
            }
        }
    }

    /**
     * Get all locked tokens
     *
     * @return
     */
    public List<RefCounterLock> getAllLockedTokens() {
        List<RefCounterLock> tokens = new ArrayList<>();

        Iterator<Cache.Entry<String, RefCounterLock>> iterator = this.locks.iterator();
        while (iterator.hasNext()) {
            Cache.Entry<String, RefCounterLock> entry = iterator.next();
            RefCounterLock rLock = entry.getValue();
            FencedLock lock = getLock(rLock);
            if (lock.isLocked()) {
                tokens.add(entry.getValue());
            }
        }
        return tokens;
    }

    /**
     * Release all locks locked by this cluster instance
     */
    public void releaseLocalLocks() {
        logger.info("RELEASE ALL LOCKS");
        this.mainLock();
        try {
            // avoid concurrent modification exception
            ArrayList<String> effectiveTokens = new ArrayList<>(myLocks);
            for (String eToken : effectiveTokens) {
                logger.info(" * " + eToken);
                RefCounterLock lock = locks.get(eToken);
                if (lock != null) {
                    logger.info("   * " + lock);
                    this.unlock(lock.token, lock.audience, true);
                }
            }

        } finally {
            this.mainUnlock();
        }
        logger.info("ALL LOCKS UNLOCKED");
    }

    public List<String> getMyLocks() {
        return new ArrayList<>(myLocks);
    }
}
