/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.DependencyScope;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.VariableProperty;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.Propertable;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.ValueGenerators.EmptyMap;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.view.HashListView;
import com.wegas.editor.view.HtmlView;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
/*@Table(indexes = {
 @Index(columnList = "properties.objectdescriptor_variabledescriptor_id")
 })*/
public class ObjectDescriptor extends VariableDescriptor<ObjectInstance> implements Propertable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyString.class,
        view = @View(label = "Description", value = HtmlView.class))
    private String description;
    /**
     *
     */
    @ElementCollection
    @JsonIgnore
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyMap.class,
            view = @View(label = "Descriptor properties", value = HashListView.class))
    private List<VariableProperty> properties = new ArrayList<>();

    @Override
    @JsonIgnore
    public List<VariableProperty> getInternalProperties() {
        return this.properties;
    }

    /**
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     *
     * @param p
     *
     * @return number of property in the payer instance
     */
    @Scriptable(dependsOn = DependencyScope.SELF)
    public int size(Player p) {
        return this.getInstance(p).getProperties().size();
    }

    /**
     * Returns the value of the 'key' propery in the player instance
     *
     * @param p
     * @param key
     *
     * @return the value of the property in the player instance
     */
    @Scriptable(dependsOn = DependencyScope.SELF)
    public String getProperty(Player p, String key) {
        return this.getInstance(p).getProperties().get(key);
    }

    /**
     *
     * @param p
     * @param key
     * @param value
     */
    @Scriptable(dependsOn = DependencyScope.NONE)
    public void setProperty(Player p,
        @Param(view = @View(label = "Key")) String key,
        @Param(view = @View(label = "Value")) String value) {
        this.getInstance(p).setProperty(key, value);
    }

    /**
     *
     * @param p
     * @param key
     */
    public void removeProperty(Player p, String key) {
        this.getInstance(p).removeProperty(key);
    }

    /**
     *
     * @param p
     * @param key
     *
     * @return the value of the property in the player instance
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
    public void setInstanceProperty(Player p, String key, String value) {
        this.getInstance(p).setProperty(key, value);
    }

    public double getNumberInstanceProperty(Player p, String key) {
        String value = this.getProperty(p, key);
        if (value != null) {
            try {
                return Double.parseDouble(value);
            } catch (NumberFormatException e) {
                return Double.NaN;
            }
        } else {
            return Double.NaN;
        }
    }

    /**
     *
     * @param p
     * @param key
     * @param value
     */
    public void addNumberAtInstanceProperty(Player p, String key, String value) {
        try {
            ObjectInstance instance = this.getInstance(p);
            double oldValue = instance.getPropertyD(key);
            Double newValue = oldValue + Double.parseDouble(value);
            instance.setProperty(key, newValue.toString());
        } catch (NumberFormatException e) {
            // do nothing...
            logger.trace("Fails to add NaN ({}) to property {}", value, key);
        }
    }

}
