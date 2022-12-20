/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.ejb.nashorn;

import java.util.Enumeration;
import java.util.concurrent.ConcurrentHashMap;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * Used keep track of classes loaded by nashorn, including forbidden attempts
 * @author maxence
 */
@ApplicationScoped
public class NasHornMonitor {

    private static final ConcurrentHashMap<String, Integer> loadedClasses = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, Integer> notWhitelisted = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, Integer> blacklisted = new ConcurrentHashMap<>();

    public static void registerClass(String name) {
        loadedClasses.putIfAbsent(name, 0);
    }

    public static void registerBlacklistedClass(String name) {
        blacklisted.putIfAbsent(name, 0);
    }

    public static void registerNotWhitelistedClass(String name) {
        notWhitelisted.putIfAbsent(name, 0);
    }

    public Enumeration<String> getClasses() {
        return loadedClasses.keys();
    }

    public Enumeration<String> getNotWhitelusted() {
        return notWhitelisted.keys();
    }

    public Enumeration<String> getBlacklistedClasses() {
        return blacklisted.keys();
    }
}
