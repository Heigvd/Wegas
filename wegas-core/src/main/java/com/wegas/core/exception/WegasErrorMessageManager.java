/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception;

import com.wegas.core.exception.client.WegasErrorMessage;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class WegasErrorMessageManager {

    public void throwWarn(String message) {
        throw WegasErrorMessage.warn(message);
    }

    public void throwError(String message) {
        throw WegasErrorMessage.error(message);
    }

    public void throwInfo(String message) {
        throw WegasErrorMessage.info(message);
    }

}
