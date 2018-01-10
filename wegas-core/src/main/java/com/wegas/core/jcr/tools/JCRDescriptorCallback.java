/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.tools;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.Mergeable;
import javax.jcr.RepositoryException;

/**
 *
 * @author maxence
 */
public class JCRDescriptorCallback implements WegasCallback {

    @Override
    public void postUpdate(Mergeable entity, Object ref, Object identifier) {
        try {
            AbstractContentDescriptor item = (AbstractContentDescriptor) entity;
            item.setContentToRepository();
            item.getContentFromRepository();
        } catch (RepositoryException ex) {
            throw new WegasErrorMessage("error", "Repository Exception");
        }
    }

}
