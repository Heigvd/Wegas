/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.tools;

import com.wegas.core.jcr.content.AbstractContentDescriptor;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.merge.utils.WegasFactory;
import com.wegas.core.persistence.game.GameModel;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import javax.jcr.RepositoryException;

/**
 * JCR Descriptor used by WegasPatch to create new files/directories
 *
 * @author maxence
 */
public class JCRDescriptorFactory implements WegasFactory {

    @Override
    public <T> T newInstance(GameModel gameModel, T originalObject) throws InstantiationException, IllegalAccessException, IllegalArgumentException, InvocationTargetException, NoSuchMethodException, SecurityException {
        if (originalObject instanceof AbstractContentDescriptor) {
            AbstractContentDescriptor ori = (AbstractContentDescriptor) originalObject;
            Constructor<? extends AbstractContentDescriptor> constructor = ori.getClass().getDeclaredConstructor(String.class, String.class, ContentConnector.class);

            try {
                AbstractContentDescriptor newInstance = constructor.newInstance(ori.getName(), ori.getPath(), gameModel.getConnector(ori.getWorkspaceType()));
                newInstance.saveToRepository();

                return (T) newInstance;
            } catch (RepositoryException ex) {
                throw new InstantiationException("JCR Repository Exception -> " + ex.toString());
            }
        } else {
            throw new InstantiationException("This factory cannot handle " + originalObject.getClass() + " object");
        }
    }

}
