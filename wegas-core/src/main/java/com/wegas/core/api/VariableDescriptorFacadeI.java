/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.List;
import java.util.Set;
import javax.persistence.NoResultException;

/**
 * @author maxence
 */
public interface VariableDescriptorFacadeI {

    VariableDescriptor find(final Long entityId);

    /**
     * @param gameModel
     * @param name
     *
     * @return the gameModel descriptor matching the name
     *
     * @throws WegasNoResultException
     */
    VariableDescriptor find(final GameModel gameModel, final String name) throws WegasNoResultException;

    /**
     * @param gameModelId
     *
     * @return all gameModel descriptors
     */
    Set<VariableDescriptor> findAll(final Long gameModelId);

    /**
     * @param <T>
     * @param gamemodel
     * @param variableDescriptorClass the filtering class
     *
     * @return All specified classes and subclasses belonging to the game model.
     */
    <T extends VariableDescriptor> List<T> findByClass(final GameModel gamemodel, final Class<T> variableDescriptorClass);

    /**
     * @param gameModelId
     *
     * @return gameModel root-level descriptor
     */
    List<VariableDescriptor> findByGameModelId(final Long gameModelId);

    /**
     * @param gameModel
     * @param label
     *
     * @return the gameModel descriptor matching the label
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    VariableDescriptor findByLabel(final GameModel gameModel, final String label) throws WegasNoResultException;

    /**
     * For backward compatibility, use find(final GameModel gameModel, final
     * String name) instead.
     *
     * @param gameModel
     * @param name
     *
     * @return the gameModel descriptor matching the name
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     * @deprecated
     */
    VariableDescriptor findByName(final GameModel gameModel, final String name) throws WegasNoResultException;

    /**
     * @param gameModel
     * @param title     title we look for
     *
     * @return all gameModel descriptors with the given title
     */
    List<VariableDescriptor> findByTitle(final GameModel gameModel, final String title);

    /**
     * @param vd
     *
     * @return descriptor container
     *
     * @deprecated use {@link VariableDescriptor#getParent()}
     */
    DescriptorListI findParentList(VariableDescriptor vd) throws NoResultException;

    /**
     * @param item
     *
     * @return the parent descriptor
     *
     * @throws WegasNoResultException if the desciptor is at root-level
     * @deprecated use {@link VariableDescriptor#getParentList()}
     */
    ListDescriptor findParentListDescriptor(final VariableDescriptor item) throws WegasNoResultException;

    boolean hasVariable(final GameModel gameModel, final String name);

}
