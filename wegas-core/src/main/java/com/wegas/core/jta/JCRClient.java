/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jta;

/**
 *
 * @author maxence
 */
public interface JCRClient {

    void inject(JCRConnectorProvider txBean);
}
