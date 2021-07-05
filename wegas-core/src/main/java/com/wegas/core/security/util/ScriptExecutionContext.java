/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.util;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.RequestManager.RequestContext;

/**
 *
 * @author maxence
 */
public class ScriptExecutionContext implements AutoCloseable {

    private final RequestManager requestManager;
    private final boolean doFlush;
    private final RequestContext previousContext;

    public ScriptExecutionContext(RequestManager requestManager, RequestContext newContext, boolean doFLush) {
        this.requestManager = requestManager;
        this.doFlush = doFLush;
        this.previousContext = this.requestManager.getCurrentContext();
        if (this.doFlush) {
            this.requestManager.flush(); // flush to trigger all permission checks befors switchig to new context
        }
        this.requestManager.setCurrentContext(newContext);

    }

    @Override
    public void close() {
        if (doFlush) {
            requestManager.flush();
        }
        requestManager.setCurrentContext(previousContext);
    }
}
