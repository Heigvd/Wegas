/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.jta;

/**
 *
 * JPA entity which implements JCRClient indicate to EntityListener
 * it requires a JCRConnectorProvider instance
 *
 * @author maxence
 */
public interface JCRClient {

    /**
     * Give JCRConnectorProvider to be used by the JPA entity
     *
     * @param jcrConnectorProvider
     */
    void inject(JCRConnectorProvider jcrConnectorProvider);
}
