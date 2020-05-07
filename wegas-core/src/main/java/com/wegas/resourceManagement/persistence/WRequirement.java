/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import static ch.albasim.wegas.annotations.CommonView.LAYOUT.extraShortInline;
import static ch.albasim.wegas.annotations.CommonView.LAYOUT.shortInline;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.ValueGenerators.Zero;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.SelectView;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Entity
@Table(uniqueConstraints = @UniqueConstraint(
    columnNames = {"taskinstance_id", "wrequirement_name"}),
    indexes = {
        @Index(columnList = "taskinstance_id")
    }
)
public class WRequirement extends AbstractEntity implements NamedEntity {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @Column(name = "id")
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     *
     */
    @Column(name = "wrequirement_name")
    @NotNull
    @WegasEntityProperty(
        nullable = false,
        view = @View(
            label = "Script Alias",
            featureLevel = ADVANCED,
            index = -1
        ))
    private String name;
    /**
     *
     */
    @Column(name = "wlimit")
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = Zero.class,
        view = @View(label = "Limit", layout = extraShortInline, index = 10))
    private Integer limit = 0;
    /**
     *
     */
    @Column(name = "wwork")
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = EmptyString.class,
        view = @View(label = "", layout = shortInline, value = SelectView.WorkSkills.class, index = 3))
    private String work = "";
    /*
     *
     */
    @Column(name = "wlevel")
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = Zero.class,
        view = @View(label = "", layout = shortInline, value = SelectView.WorkLevels.class, index = 2))
    private Integer level = 0;
    /**
     *
     */
    @ManyToOne
    private TaskInstance taskInstance;
    /*
     *
     */
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = Zero.class,
        view = @View(label = "Quantity", layout = extraShortInline, index = 1))
    private Long quantity = 0L;
    /*
     *
     */
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = Zero.class,
        view = @View(label = "Completeness", value = Hidden.class))
    private Double completeness = 0.0D;
    /*
     *
     */
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = Zero.class,
        view = @View(label = "Quality", value = Hidden.class))
    private Double quality = 0.0D;

    /**
     *
     */
    @OneToMany(mappedBy = "requirement", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Activity> activities = new ArrayList<>();

    /**
     *
     */
    public WRequirement() {
        // useless but ensure there is an empty constructor
    }

    /**
     *
     * @param work
     */
    public WRequirement(String work) {
        this.work = work;
    }

    /**
     * @return the id
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     *
     * @return get requirement unique name
     */
    public String getName() {
        return name;
    }

    /**
     *
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return the limit
     */
    public int getLimit() {
        return limit;
    }

    /**
     * @param limit the limit to set
     */
    public void setLimit(int limit) {
        this.limit = limit;
    }

    /**
     * @return the work
     */
    public String getWork() {
        return work;
    }

    /**
     * @param work the work to set
     */
    public void setWork(String work) {
        this.work = work;
    }

    /**
     * @return the level
     */
    public int getLevel() {
        return level;
    }

    /**
     * @param level the level to set
     */
    public void setLevel(int level) {
        this.level = level;
    }

    /**
     * @return the quantity
     */
    public long getQuantity() {
        return quantity;
    }

    /**
     * @param quantity the quantity to set
     */
    public void setQuantity(long quantity) {
        Long pVal = this.quantity;

        if (!Objects.equals(pVal, quantity)) {
            // change detected
            this.quantity = quantity;

            /*
            TODO: fire req quantity change
            if (beans != null) {
                beans.getVariableInstanceFacade().fireNumberChange(this, pVal);
            }
             */
        }
    }

    /**
     * @return the completeness
     */
    public double getCompleteness() {
        return completeness;
    }

    /**
     * @param completeness the completeness to set
     */
    public void setCompleteness(double completeness) {
        this.completeness = Double.isNaN(completeness) ? 0 : completeness;
    }

    /**
     * @return the quality
     */
    public double getQuality() {
        return quality;
    }

    /**
     * @param quality the quality to set
     */
    public void setQuality(double quality) {
        this.quality = quality;
    }

    /**
     *
     * @return the task instance the requirement belongs to
     */
    @JsonIgnore
    public TaskInstance getTaskInstance() {
        return taskInstance;
    }

    /**
     *
     * @param taskInstance
     */
    @JsonIgnore
    public void setTaskInstance(TaskInstance taskInstance) {
        this.taskInstance = taskInstance;
    }

    /**
     *
     * @deprecated (I hope so)
     * @param variable
     *
     * @return just not a clue...
     */
    public double getVariableValue(String variable) {
        switch (variable) {
            case "quality":
                return this.getQuality();
            case "quantity":
                return this.getQuantity();
            default:
                return Double.NaN;
        }
    }

    /**
     *
     * @param variable
     * @param value
     */
    public void setVariableValue(String variable, double value) {
        switch (variable) {
            case "level":
                this.setLevel(((Long) Math.round(value)).intValue());
                break;
            case "quantity":
                this.setQuantity(Math.round(value));
                break;
            default:
                throw new UnsupportedOperationException("Unexpected parameter " + variable);
        }
    }

    /**
     *
     * @param variable
     * @param value
     */
    public void addAtVariableValue(String variable, double value) {
        switch (variable) {
            case "level":
                this.setLevel(this.getLevel() + ((Long) Math.round(value)).intValue());
                break;
            case "quantity":
                this.setQuantity(this.getQuantity() + Math.round(value));
                break;
            default:
                throw new UnsupportedOperationException("Unexpected parameter " + variable);
        }
    }

    public void addActivity(Activity activity) {
        this.activities.add(activity);
        activity.setRequirement(this);
    }

    public void removeActivity(Activity activity) {
        this.activities.remove(activity);
    }

    @Override
    public String toString() {
        return "Requirement[" + this.getName() + "](" + this.id + ", " + this.work + ", limit: " + this.limit + ", level:  " + this.level + ")";
    }

    @PrePersist
    public void checkName() {
        if (name == null || name.isEmpty()) {
            name = work + level + quantity + Helper.genToken(4);
        }
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getTaskInstance();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getTaskInstance().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getTaskInstance().getRequieredReadPermission();
    }
}
