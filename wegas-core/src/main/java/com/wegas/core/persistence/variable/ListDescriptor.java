/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.merge.annotations.WegasEntity;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@NamedQuery(name = "ListDescriptor.findDistinctChildrenLabels",
        query = "SELECT DISTINCT(child.label) FROM VariableDescriptor child WHERE child.parentList.id = :containerId")
@WegasEntity(callback = ListDescriptor.ValidateShortcutCallback.class)
public class ListDescriptor extends VariableDescriptor<VariableInstance> implements DescriptorListI<VariableDescriptor> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(ListDescriptor.class);
    /**
     *
     */
    //@BatchFetch(BatchFetchType.IN)
    @OneToMany(mappedBy = "parentList", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @OrderColumn(name = "ld_items_order")
    @WegasEntityProperty(includeByDefault = false, callback = DescriptorListI.UpdateChild.class)
    private List<VariableDescriptor> items = new ArrayList<>();

    /**
     * List of allowed children types
     */
    @ElementCollection
    @WegasEntityProperty
    private List<String> allowedTypes = new ArrayList<>();

    /**
     * shortcut to show within (+) treeview button, must match allowedTypes
     */
    @WegasEntityProperty
    private String addShortcut = "";

    /**
     *
     */
    public ListDescriptor() {
        super();
    }

    /**
     *
     * @param name
     */
    public ListDescriptor(String name) {
        super(name);
    }

    /*  @Override
     public Boolean contains(String criteria) {
     if (super.contains(criteria)) {
     return true;
     } else {
     for (VariableDescriptor d : this.getItems()) {
     if (d.contains(criteria)) {
     return true;
     }
     }
     }
     return false;
     }*/
    /**
     *
     * @param gameModel
     */
    @Override
    public void setGameModel(GameModel gameModel) {
        super.setGameModel(gameModel);
        for (VariableDescriptor item : this.getItems()) {
            item.setGameModel(gameModel);
        }
    }

    /**
     * @return the variableDescriptors
     */
    @Override
    @JsonView(Views.ExportI.class)
    public List<VariableDescriptor> getItems() {
        return this.items;
    }

    @Override
    public void resetItemsField() {
        this.items = new ArrayList<>();
    }

    @Override
    public void setChildParent(VariableDescriptor child) {
        if (isAuthorized(child)) {
            child.setParentList(this);
        } else {
            throw WegasErrorMessage.error(child.getClass().getSimpleName() + " not allowed in this folder");
        }
    }

    /**
     *
     * @param type
     */
    private boolean isAuthorized(String type) {
        return (this.getAllowedTypes().isEmpty() || this.getAllowedTypes().contains(type));
    }

    /**
     *
     * @param child
     */
    private boolean isAuthorized(VariableDescriptor child) {
        return this.isAuthorized(child.getJSONClassName());
    }

    /**
     * Get the list of allowed types
     *
     * @return allowed types
     */
    public List<String> getAllowedTypes() {
        return this.allowedTypes;
    }

    /**
     * set the list of allowed types
     *
     * @param types allowed types
     */
    public void setAllowedTypes(List<String> types) {
        this.allowedTypes = types;
    }

    public String getAddShortcut() {
        return addShortcut;
    }

    public void setAddShortcut(String addShortcut) {
        this.addShortcut = addShortcut;
    }

    public List<VariableDescriptor> flatten() {
        final List<VariableDescriptor> acc = new ArrayList<>();
        for (VariableDescriptor v : this.getItems()) {
            if (v instanceof ListDescriptor) {
                acc.addAll(((ListDescriptor) v).flatten());
            } else {
                acc.add(v);
            }
        }
        return acc;
    }

    /*@PrePersist
    public void prePersist_cleanDefaultInstance() {
        VariableInstance defaultInstance = this.getDefaultInstance();
        if (defaultInstance instanceof NumberInstance) {
            this.setDefaultInstance(new ListInstance());
        }
    }*/
    public static class ValidateShortcutCallback implements WegasCallback {

        @Override
        public void postUpdate(Mergeable entity, Object ref, Object identifier) {
            if (entity instanceof ListDescriptor) {
                ListDescriptor listDescriptor = (ListDescriptor) entity;
                String shortcut = listDescriptor.getAddShortcut();
                if (!Helper.isNullOrEmpty(shortcut) && !listDescriptor.isAuthorized(shortcut)) {
                    throw WegasErrorMessage.error(shortcut + " not allowed in this folder");
                }
            }
        }
    }
}
