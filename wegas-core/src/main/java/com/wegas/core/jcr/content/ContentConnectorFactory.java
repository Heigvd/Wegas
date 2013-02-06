/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import javax.jcr.RepositoryException;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class ContentConnectorFactory {

    /**
     *
     * @param gameModelId
     * @return
     * @throws RepositoryException
     */
    static public ContentConnector getContentConnectorFromGameModel(Long gameModelId) throws RepositoryException {
        if (gameModelId == null) {
            return new ContentConnector();
        } else {

            return new ContentConnector(gameModelId);
        }
    }
}
