/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import static ch.albasim.wegas.annotations.CommonView.LAYOUT.shortInline;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.VariableProperty;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.Propertable;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.ValueGenerators.EmptyMap;
import com.wegas.editor.View.HashListView;
import com.wegas.editor.jsonschema.ListOfTasksSchema;
import com.wegas.editor.view.I18nHtmlView;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Transient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 *
 */
@Entity
@Table(
        indexes = {
            @Index(columnList = "description_id")
        }
)
public class TaskDescriptor extends VariableDescriptor<TaskInstance> implements Propertable {

    private static final Logger logger = LoggerFactory.getLogger(TaskDescriptor.class);

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyI18n.class,
            view = @View(label = "Description", value = I18nHtmlView.class))
    private TranslatableContent description;

    /**
     *
     */
    @Column(length = 24)
    @WegasEntityProperty(
            optional = false, nullable = false,
            view = @View(label = "Task Number", layout = shortInline, index = -471))
    private String index;
    /**
     *
     */
    @ElementCollection
    @JsonIgnore
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyMap.class,
            view = @View(label = "Descriptor properties", value = HashListView.class))
    private List<VariableProperty> properties = new ArrayList<>();
    /**
     *
     */
    @ManyToMany
    @JoinTable(
            joinColumns = {
                @JoinColumn(name = "taskdescriptor_id")},
            inverseJoinColumns = {
                @JoinColumn(name = "predecessor_id")})// prevent change in the db
    @JsonIgnore
    private List<TaskDescriptor> predecessors = new ArrayList<>();
    /*
     *
     */
    @ManyToMany(mappedBy = "predecessors")
    @JsonIgnore
    private List<TaskDescriptor> dependencies = new ArrayList<>();
    /**
     *
     */
    @Transient
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(label = "Predecessors"),
            schema = ListOfTasksSchema.class)
    private Set<String> predecessorNames/*
             * = new ArrayList<>()
             */;

    @JsonIgnore
    @Override
    public List<VariableProperty> getInternalProperties() {
        return this.properties;
    }

    /**
     * @return the description
     */
    public TranslatableContent getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(TranslatableContent description) {
        this.description = description;
        if (this.description != null) {
            this.description.setParentDescriptor(this);
        }
    }

    /**
     * @return the index
     */
    public String getIndex() {
        return index;
    }

    /**
     * @param index the index to set
     */
    public void setIndex(String index) {
        this.index = index;
    }

    /**
     * @return the predecessors
     */
    public List<TaskDescriptor> getPredecessors() {
        return predecessors;
    }

    /**
     * @param predecessors the predecessors to set
     */
    public void setPredecessors(List<TaskDescriptor> predecessors) {
        this.predecessors = predecessors;
        this.predecessorNames = null;
    }

    /**
     * @param index
     *
     * @return the predecessors
     */
    public TaskDescriptor getPredecessor(Integer index) {
        return predecessors.get(index);
    }

    /**
     * @param index
     * @param taskDescriptor
     */
    public void setPredecessor(Integer index, TaskDescriptor taskDescriptor) {
        this.predecessors.set(index, taskDescriptor);
        this.predecessorNames = null;
    }

    /**
     * @param taskDescriptor
     */
    public void addPredecessor(final TaskDescriptor taskDescriptor) {
        this.predecessors.add(taskDescriptor);
        taskDescriptor.dependencies.add(this);
        this.predecessorNames = null;
    }

    /**
     * @param taskDescriptor
     */
    public void removePredecessor(final TaskDescriptor taskDescriptor) {
        this.predecessors.remove(taskDescriptor);
        this.predecessorNames = null;
    }

    public List<TaskDescriptor> getDependencies() {
        return dependencies;
    }

    /**
     * @param taskDescriptor
     */
    public void removeDependency(final TaskDescriptor taskDescriptor) {
        this.dependencies.remove(taskDescriptor);
    }

    //Methods for impacts
    /**
     * get and cast a player's instance property to double
     *
     * @param p
     * @param key
     *
     * @return double castes player instance property
     */
    @Scriptable(label = "Get number property")
    public double getNumberInstanceProperty(Player p, String key) {
        String value = this.getInstance(p).getProperty(key);
        double parsedValue;
        try {
            parsedValue = Double.parseDouble(value);
        } catch (NumberFormatException e) {
            parsedValue = Double.NaN;
        }
        return parsedValue;
    }

    /**
     *
     * @param p
     * @param key
     *
     * @return player instance string property
     */
    @Scriptable(label = "Get text property")
    public String getStringInstanceProperty(Player p, String key) {
        return this.getInstanceProperty(p, key);
    }

    /**
     * {@link #getStringInstanceProperty(com.wegas.core.persistence.game.Player, java.lang.String) duplicata}
     *
     * @param p
     * @param key
     *
     * @return player instance string property
     */
    public String getInstanceProperty(Player p, String key) {
        return this.getInstance(p).getProperty(key);
    }

    /**
     *
     * @param p
     * @param key
     * @param value
     */
    @Scriptable(label = "Set property")
    public void setInstanceProperty(Player p,
            @Param(view = @View(label = "Key")) String key,
            @Param(view = @View(label = "Value")) String value) {
        // TODO: fire property change
        this.getInstance(p).setProperty(key, value);
    }

    /**
     *
     * @param p
     * @param key
     * @param value
     */
    @Scriptable(label = "Add to property")
    public void addNumberAtInstanceProperty(Player p,
            @Param(view = @View(label = "Key")) String key,
            @Param(view = @View(label = "Value")) String value) {
        try {
            TaskInstance instance = this.getInstance(p);
            double oldValue = instance.getPropertyD(key);
            Double newValue = oldValue + Double.parseDouble(value);
            // TODO: fire property change
            instance.setProperty(key, newValue.toString());
        } catch (NumberFormatException e) {
            logger.error("addNumberToProperty: {}", e);
            // do nothing...
        }
    }

    /**
     *
     * @deprecated moved as property
     * @param p
     *
     * @return player instance task duration
     */
    public double getDuration(Player p) {
        return this.getInstance(p).getPropertyD("duration");
    }

    /**
     *
     * @deprecated moved as property
     * @param p
     * @param value
     */
    public void setDuration(Player p, double value) {
        this.getInstance(p).setProperty("duration", Double.toString(value));
    }

    /**
     *
     * @deprecated moved as property
     * @param p
     * @param value
     */
    public void addAtDuration(Player p, double value) {
        TaskInstance instance = this.getInstance(p);
        double v = instance.getPropertyD("duration") + value;
        instance.setProperty("duration", Double.toString(v));
    }

    public WRequirement getRequirementByName(Player p, String name) {
        return this.getInstance(p).getRequirementByName(name);
    }

    /**
     *
     * @param p
     * @param name
     * @param variable
     * @param value
     */
    public void setRequirementVariable(Player p, String name, String variable, double value) {
        WRequirement requirement = this.getRequirementByName(p, name);
        if (requirement != null) {
            requirement.setVariableValue(variable, value);
        }
    }

    /**
     *
     * @param p
     * @param name
     * @param variable
     * @param value
     */
    public void addAtRequirementVariable(Player p, String name, String variable, double value) {
        WRequirement requirement = this.getRequirementByName(p, name);
        if (requirement != null) {
            requirement.addAtVariableValue(variable, value);
        }
    }

    /**
     *
     * @param p
     *
     * @return true if the player instance is active
     */
    @Scriptable(label = "is active")
    public boolean getActive(Player p) {
        TaskInstance instance = this.getInstance(p);
        return instance.getActive();
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setActive(Player p, boolean value) {
        TaskInstance instance = this.getInstance(p);
        instance.setActive(value);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void activate(Player p) {
        this.setActive(p, true);
    }

    /**
     *
     * @param p
     */
    @Deprecated
    public void desactivate(Player p) {
        this.deactivate(p);
    }

    @Scriptable
    public void deactivate(Player p) {
        this.setActive(p, false);
    }

    /**
     * @return the exportedPredecessors
     */
    public Set<String> getPredecessorNames() {
        if (predecessorNames == null) {
            Set<String> names = new HashSet<>();
            for (TaskDescriptor t : this.getPredecessors()) {
                names.add(t.getName());
            }
            return names;
        } else {
            return predecessorNames;
        }
    }

    /**
     * When importing from JSON, predecessors or identified by their names
     *
     * @return names of predecessors, as imported from such a JSON
     */
    @JsonIgnore
    public Set<String> getImportedPredecessorNames() {
        return this.predecessorNames;
    }

    /**
     * @param exportedPredecessors the exportedPredecessors to set
     */
    public void setPredecessorNames(Set<String> exportedPredecessors) {
        this.predecessorNames = exportedPredecessors;
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        VariableDescriptorFacade vdf = beans.getVariableDescriptorFacade();

        for (TaskDescriptor theTask : this.dependencies) {
            VariableDescriptor desc = vdf.find(theTask.getId());
            if (desc instanceof TaskDescriptor) {
                ((TaskDescriptor) desc).removePredecessor(this);
            }
        }
        this.dependencies = new ArrayList<>();

        for (TaskDescriptor theTask : this.predecessors) {
            VariableDescriptor desc = vdf.find(theTask.getId());
            if (desc instanceof TaskDescriptor) {
                ((TaskDescriptor) desc).removeDependency(this);
            }
        }
        this.setPredecessors(new ArrayList<>());

        super.updateCacheOnDelete(beans);
    }


    /*
     * BACKWARD COMPAT
     */
    /**
     * @param iterations
     */
    public void setIterations(List<Iteration> iterations) {
        /*
         * if (this.getDefaultInstance().getIterations() == null ||
         * this.getDefaultInstance().getIterations().isEmpty()) {
         * this.getDefaultInstance().setIterations(iterations);
         * }
         */
    }

    public void setActivities(List<Activity> iterations) {
        // backward compatibility
    }

    public void setAssignments(List<Assignment> iterations) {
        // backward compatibility
    }
}
