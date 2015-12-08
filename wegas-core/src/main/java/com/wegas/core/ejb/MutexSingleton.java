/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import javax.ejb.LocalBean;
import javax.ejb.Lock;
import javax.ejb.LockType;
import javax.ejb.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Singleton
@LocalBean
public class MutexSingleton {

    public class RefCounterLock {

        public int counter;
        public ReentrantLock sem;

        public RefCounterLock() {
            counter = 0;
            sem = new ReentrantLock(false); // true will favorize long-waiting threads
        }
    }

    private static final Logger logger = LoggerFactory.getLogger(MutexSingleton.class);

    Map<String, RefCounterLock> locks = new ConcurrentHashMap<>();

    public ReentrantLock _lock = new ReentrantLock();

    @Lock(LockType.READ)
    public void lock(String token) {
        //logger.error("try to lock " + token);

        RefCounterLock lock;

        synchronized (this) {
            locks.putIfAbsent(token, new RefCounterLock());
            lock = locks.get(token);
            lock.counter++;
        }

        lock.sem.lock();
        //logger.error("lock " + token + " acquired");
    }

    private void unlock(RefCounterLock lock, String token) {
        lock.sem.unlock();
        lock.counter--;
        if (lock.counter == 0) {
            locks.remove(token);
            //logger.error("CLEAN LOCK LIST");
        }

    }

    @javax.ejb.Lock(LockType.READ)
    public void unlock(String token) {
        //logger.error("unlock " + token);
        RefCounterLock lock = locks.getOrDefault(token, null);
        if (lock != null) {
            synchronized (this) {
                this.unlock(lock, token);
            }
        }
    }

    @javax.ejb.Lock(LockType.READ)
    public void unlockFull(String token) {
        RefCounterLock lock = locks.getOrDefault(token, null);
        if (lock != null) {
            synchronized (this) {
                while (lock.sem.getHoldCount() > 0) {
                    this.unlock(lock, token);
                }
            }
        }
    }
}
