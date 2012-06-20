/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.content;

import javax.jcr.RepositoryException;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class ContentConnectorFactory {

    static public ContentConnector getContentConnectorFromGameModel(Long gameModelId) throws RepositoryException {
        if (gameModelId == null) {
            return new ContentConnector();
        } else {

            return new ContentConnector(gameModelId);
        }
    }
}
