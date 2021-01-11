/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.util;

import com.wegas.core.ejb.RequestManager;

/**
 *
 * @author maxence
 */
public class Sudoer implements AutoCloseable {

    private final RequestManager requestManager;

    public Sudoer(RequestManager requestManager) {
        this(requestManager, 1l);
    }

    public Sudoer(RequestManager requestManager, Long id) {
        this.requestManager = requestManager;
        // flush all pending changes before su
        requestManager.getEntityManager().flush();

        requestManager.su(id);
    }

    @Override
    public void close() {
        // flush all changes before releasing su
        requestManager.getEntityManager().flush();
        requestManager.releaseSu();
    }
}
