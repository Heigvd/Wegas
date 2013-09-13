/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.Basic;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Lob;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class ResourceDescriptor extends VariableDescriptor<ResourceInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    private String description;
    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties = new HashMap<>();

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        ResourceDescriptor other = (ResourceDescriptor) a;
        this.setDescription(other.getDescription());
        this.properties.clear();
        this.properties.putAll(other.getProperties());
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
     * @return the properties
     */
    public Map<String, String> getProperties() {
        return this.properties;
    }

    /**
     * @param properties the properties to set
     */
    public void setProperties(Map<String, String> properties) {
        this.properties = properties;
    }

    /**
     *
     * @param key
     * @param val
     */
    public void setProperty(String key, String val) {
        this.properties.put(key, val);
    }

    /**
     *
     * @param key
     * @return
     */
    public String getProperty(String key) {
        return this.properties.get(key);
    }

    // **** Sugar for editor *** //
    /**
     *
     * @param p
     */
    public void getConfidence(Player p) {
        this.getInstance(p).getConfidence();
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setConfidence(Player p, Integer value) {
        this.getInstance(p).setConfidence(value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtConfidence(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        instance.setConfidence(instance.getConfidence() + value);
    }

    /**
     *
     * @param p
     */
    public void getMoral(Player p) {
        this.getInstance(p).getMoral();
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setMoral(Player p, Integer value) {
        this.getInstance(p).setMoral(value);
    }
    
    /**
     * 
     * @param p
     * @param key
     * @return 
     */
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
     * @return 
     */
    public String getStringInstanceProperty(Player p, String key) {
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
    
    /**
     *
     * @param p
     * @param key
     * @param value
     */
    public void addAtInstanceProperty(Player p, String key, String value) {
        this.getInstance(p).setProperty(key, "" + (Float.parseFloat(this.getInstance(p).getProperty(key)) + value));
    }

    public void addOccupation(Player p, Double time , Boolean editable, String description) {
        ResourceInstance instance = this.getInstance(p);
        Occupation occupation = new Occupation();
        occupation.setDescription(description);
        occupation.setEditable(editable);
        occupation.setTime(time);
        instance.addOccupation(occupation);
    }

    public void removeOccupationsAtTime(Player p, Double time) {
        ResourceInstance instance = this.getInstance(p);
        List<Occupation> toRemove = new ArrayList<>();
        Integer i = 0;
        for (Occupation occupation : instance.getOccupations()) {
            if (occupation.getTime().doubleValue() == time) {
                toRemove.add(occupation);
            }
        }
        while (toRemove.size() > i) {
            instance.getOccupations().remove(toRemove.get(i));
            i++;
        }
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtMoral(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        instance.setMoral(instance.getMoral() + value);
    }

    //Methods below are temporary ; only for CEP-Game
    /**
     *
     * @param p
     */
    public void getSalary(Player p) {
        this.getInstance(p).getProperty("salary");
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setSalary(Player p, Integer value) {
        this.getInstance(p).setProperty("salary", "" + value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtSalary(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        int newVal = Integer.parseInt(instance.getProperty("salary")) + value;
        instance.setProperty("salary", "" + newVal);
    }

    /**
     *
     * @param p
     */
    public void getExperience(Player p) {
        this.getInstance(p).getProperty("experience");
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setExperience(Player p, Integer value) {
        this.getInstance(p).setProperty("experience", "" + value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtExperience(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        int newVal = Integer.parseInt(instance.getProperty("experience")) + value;
        instance.setProperty("experience", "" + newVal);
    }

    /**
     *
     * @param p
     */
    public void getLeadershipLevel(Player p) {
        this.getInstance(p).getProperty("leadershipLevel");
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setLeadershipLevel(Player p, Integer value) {
        this.getInstance(p).setProperty("leadershipLevel", "" + value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtLeadershipLevel(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        int newVal = Integer.parseInt(instance.getProperty("leadershipLevel")) + value;
        instance.setProperty("leadershipLevel", "" + newVal);
    }

    /**
     *
     * @param p
     */
    public void getActive(Player p) {
        ResourceInstance instance = this.getInstance(p);
        instance.getActive();
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setActive(Player p, Boolean value) {
        ResourceInstance instance = this.getInstance(p);
        instance.setActive(value);
    }

    /**
     *
     * @param p
     */
    public void activate(Player p) {
        this.setActive(p, true);
    }

    /**
     *
     * @param p
     */
    public void desactivate(Player p) {
        this.setActive(p, false);
    }
}
