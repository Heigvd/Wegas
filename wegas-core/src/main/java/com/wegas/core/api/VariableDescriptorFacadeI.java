/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import jakarta.persistence.NoResultException;

/**
 *
 * Expose business methods related to VariableDescritors
 *
 * @author maxence
 */
public interface VariableDescriptorFacadeI {

    VariableDescriptor find(final Long entityId);

    /**
     * Look for a VariableDescriptor identified by name within the given gameModel.
     *
     * @param gameModel gameModel to explore
     * @param name      name of the variableDescriptor to search
     *
     * @return the gameModel descriptor matching the name
     *
     * @throws WegasNoResultException if no such variabledescriptor exists
     */
    VariableDescriptor find(final GameModel gameModel, final String name) throws WegasNoResultException;

    /**
     * Return all variableDescripor in the gameModel identified by its id
     *
     * @param gameModelId id of the gameModel
     *
     * @return all gameModel descriptors
     */
    Collection<VariableDescriptor> findAll(final Long gameModelId);

    /**
     * Get all variableDescritpor from a gameModel, filtered by their type
     *
     * @param <T>
     * @param gamemodel
     * @param variableDescriptorClass the filtering class
     *
     * @return All descriptor which are instanceof the given class, belonging to the game model.
     */
    <T extends VariableDescriptor> List<T> findByClass(final GameModel gamemodel, final Class<T> variableDescriptorClass);

    /**
     * Get gameModel root-level descriptor
     *
     * @param gameModelId id of the gameModel
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
     * For backward compatibility, use find(final GameModel gameModel, final String name) instead.
     *
     * @param gameModel
     * @param name
     *
     * @return the gameModel descriptor matching the name
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     * @deprecated
     */
    @Deprecated
    VariableDescriptor findByName(final GameModel gameModel, final String name) throws WegasNoResultException;

    /**
     * @param gameModel
     * @param prefix    prefix we look for
     *
     * @return all gameModel descriptors with the given title
     */
    List<VariableDescriptor> findByPrefix(final GameModel gameModel, final String prefix);

    /**
     * @param vd
     *
     * @return descriptor container
     *
     * @deprecated use {@link VariableDescriptor#getParent()}
     */
    @Deprecated
    DescriptorListI findParentList(VariableDescriptor vd) throws NoResultException;

    /**
     * @param item
     *
     * @return the parent descriptor
     *
     * @throws WegasNoResultException if the descriptor is at root-level
     * @deprecated use {@link VariableDescriptor#getParentList()}
     */
    @Deprecated
    ListDescriptor findParentListDescriptor(final VariableDescriptor item) throws WegasNoResultException;

    /**
     * get all VariableInstances but the default one, mapped by their respective owner
     *
     * @param vd the descriptor to fetch instances from
     *
     * @return all vd instances, mapped by their owner
     */
    Map<? extends InstanceOwner, VariableInstance> getInstances(VariableDescriptor vd);

    /**
     * Return instance of the descriptor the player has write right on
     *
     * @param vd     the descriptor to fetch instance from
     * @param player player who requests an instance
     *
     * @return instance of vd player can write
     */
    VariableInstance getInstance(VariableDescriptor vd, Player player);

    /**
     * Same as {@link #getInstances(com.wegas.core.persistence.variable.VariableDescriptor) but map by owner id
     *
     * @param vd the descriptor to fetch instances from
     *
     * @return all vd instances, mapped by their owner id
     */
    Map<Long, VariableInstance> getInstancesByKeyId(VariableDescriptor vd);

    Map<String, VariableInstance> getInstancesByKeyStringId(VariableDescriptor vd);

    /**
     * is the given name in use within the gameModel ?
     *
     * @param gameModel
     * @param name
     *
     * @return true if gameModel contains a descriptor named name
     */
    boolean hasVariable(final GameModel gameModel, final String name);

    /**
     * Create a new descriptor in a DescriptorListI
     *
     * @param gameModel   the gameModel
     * @param list        new descriptor parent
     * @param entity      new descriptor to create
     * @param resetNames  should completely reset names or try to keep provided
     * @param resetRefIds should generate brand new refIds
     * @param index       position of the new child in the parent
     *
     * @return the new descriptor
     */
    VariableDescriptor createChild(final GameModel gameModel,
        final DescriptorListI<VariableDescriptor> list,
        final VariableDescriptor entity,
        boolean resetNames,
        boolean resetRefIds,
        Integer index
    );

    /**
     * Remove variable
     *
     * @param entity    the variableDescriptor to delete
     */
    void remove(VariableDescriptor entity);

    /**
     * Move a variable to a list
     * @param descriptorId the variable descriptor to move
     * @param targetListDescriptorId the destination list.
     * @param index the insert index in destination. passing null means append
     */
    void move(final Long descriptorId, final Long targetListDescriptorId, final Integer index);


    /**
     * @param descriptorId the variable descriptor to copy
     * @param targetListDescriptorId the destination list. null means copy in current location
     * @param index the insert index in destination. passing null means append
     * @return the newly created descriptor
     * @throws java.lang.CloneNotSupportedException
     */
    VariableDescriptor copy(final Long descriptorId, final Long targetListDescriptorId, final Integer index) throws CloneNotSupportedException;

    /**
     * @param descriptorId the variable descriptor to copy
     * @param targetListDescriptorId the destination list. null means copy in current location
     * @return the newly created descriptor
     * @throws java.lang.CloneNotSupportedException
     */
    VariableDescriptor copy(final Long descriptorId, final Long targetListDescriptorId) throws CloneNotSupportedException;

    /**
     *
     * @param vd The variable descriptor to convert
     * @return the new descriptor
     */
    VariableDescriptor convertToStaticText(VariableDescriptor vd);

}
