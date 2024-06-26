/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import static ch.albasim.wegas.annotations.CommonView.LAYOUT.shortInline;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.True;
import java.util.Collection;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Entity
@Table(indexes = {
    @Index(columnList = "resourceinstance_id")
})
@JsonIgnoreProperties({"description"})
public class Occupation extends AbstractEntity implements NamedEntity {

    private static final long serialVersionUID = 5183770682755470296L;
    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     *
     */
    @Column(name = "wtime")
    @WegasEntityProperty(
            optional = false, nullable = false,
            view = @View(label = "Period number", layout = shortInline))
    private Integer time = 0;
    /**
     *
     */
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = True.class,
            view = @View(label = "Editable (?!?)", layout = shortInline))
    private Boolean editable = true;

    /**
     *
     */
    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    @JsonBackReference
    @JsonIgnore
    private ResourceInstance resourceInstance;

    /**
     *
     */
    public Occupation() {
        // useless but ensure there is an empty constructor
    }

    /**
     *
     * @param time
     */
    public Occupation(Integer time) {
        this.time = time;
    }


    /*
     @PostPersist
     @PostUpdate
     @PostRemove
     private void onUpdate() {
     this.getResourceInstance().onInstanceUpdate();
     }
    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        return this.getResourceInstance().getEntities();
    }
     */
    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * Use time as a discriminant
     *
     * @return
     */
    @JsonIgnore
    @Override
    public String getName() {
        return time.toString();
    }

    @JsonIgnore
    @Override
    public void setName(String name) {
        this.setTime(Integer.parseInt(name));
    }

    /**
     * @return the time
     */
    public Integer getTime() {
        return time;
    }

    /**
     * @param time the time to set
     */
    public void setTime(Integer time) {
        this.time = time;
    }

    /**
     * @return the ResourceInstance
     */
    @JsonBackReference
    @JsonIgnore
    public ResourceInstance getResourceInstance() {
        return resourceInstance;
    }

    /**
     * @param resourceInstance
     */
    @JsonBackReference
    public void setResourceInstance(ResourceInstance resourceInstance) {
        this.resourceInstance = resourceInstance;
    }

    /**
     * @return the editable
     */
    public boolean getEditable() {
        return editable;
    }

    /**
     * @param editable the editable to set
     */
    public void setEditable(boolean editable) {
        this.editable = editable;
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getResourceInstance();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return this.getResourceInstance().getRequieredUpdatePermission(context);
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return this.getResourceInstance().getRequieredReadPermission(context);
    }
}
