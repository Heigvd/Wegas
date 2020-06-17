/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.tools;

import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.WegasCallback;

/**
 *
 * @author maxence
 */
public class JCRDescriptorCallback implements WegasCallback {

    @Override
    public void postUpdate(IMergeable entity, Object ref, Object identifier) {
        /*
        try {
            AbstractContentDescriptor item = (AbstractContentDescriptor) entity;
            item.setContentToRepository();
            item.getContentFromRepository();
        } catch (RepositoryException ex) {
            throw new WegasErrorMessage("error", "Repository Exception");
        }
         */
    }

}
