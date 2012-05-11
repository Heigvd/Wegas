/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.game;

import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.layout.WidgetEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import java.io.Serializable;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = "name"))
@XmlType(name = "GameModel")
public class GameModelEntity extends NamedEntity implements Serializable {

    private static final Logger logger = Logger.getLogger("GameModelEntity");
    //private static final Pattern p = Pattern.compile("(^get\\()([a-zA-Z0-9_\"]+)(\\)$)");
    /**
     *
     */
    @Id
    @Column(name = "gamemodelid")
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @NotNull
    //@XmlID
    //@Pattern(regexp = "^\\w+$")
    private String name;
    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @XmlTransient
    private List<VariableDescriptorEntity> variableDescriptors;
    /**
     * A list of Variable Descriptors that are at the root level of the
     * hierarchy (other VariableDescriptor can be placed inside of a
     * ListDescriptor's items List).
     */
    @OneToMany( cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JoinColumn(name="rootgamemodel_id")
    //@JsonManagedReference
    private List<VariableDescriptorEntity> rootVariableDescriptors;
    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference
    private List<GameEntity> games;
    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference("gamemodel-widget")
    private List<WidgetEntity> widgets;
    /**
     * @fixme temporary solutions to store pages
     */
    private String cssUri;
    /**
     *
     * @fixme temporary solutions to store widgets
     */
    private String widgetsUri;

    /**
     *
     * @param force
     */
    public void propagateDefaultVariableInstance(boolean force) {
        for (VariableDescriptorEntity vd : this.getVariableDescriptors()) {
            vd.propagateDefaultInstance(force);
        }
    }

    /**
     *
     * @return
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     *
     * @param id
     */
    @Override
    public void setId(Long id) {
        this.id = id;
    }

    /**
     *
     * @return
     */
    @Override
    public String getName() {
        return name;
    }

    /**
     *
     * @param name
     */
    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     *
     * @return
     */
    @XmlTransient
    public List<VariableDescriptorEntity> getVariableDescriptors() {
        return variableDescriptors;
    }

    /**
     *
     * @param variableDescriptors
     */
    public void setVariableDescriptors(List<VariableDescriptorEntity> variableDescriptors) {
        this.variableDescriptors = variableDescriptors;
    }

    /**
     *
     * @return a list of Variable Descriptors that are at the root level of the
     * hierarchy (other VariableDescriptor can be placed inside of a
     * ListDescriptor's items List)
     */
    //@JsonManagedReference
    public List<VariableDescriptorEntity> getRootVariableDescriptors() {
        return rootVariableDescriptors;
    }

    /**
     *
     * @param variableDescriptors
     */
    //@JsonManagedReference
    public void setRootVariableDescriptors(List<VariableDescriptorEntity> variableDescriptors) {
        this.rootVariableDescriptors = variableDescriptors;
        this.variableDescriptors = variableDescriptors;
        for (VariableDescriptorEntity vd : variableDescriptors) {
            vd.setGameModel(this);
        }
    }

    /**
     *
     * @param variableDescriptor
     */
    public void addVariableDescriptor(VariableDescriptorEntity variableDescriptor) {
        this.rootVariableDescriptors.add(variableDescriptor);
        this.variableDescriptors.add(variableDescriptor);
        variableDescriptor.setGameModel(this);
    }

    /**
     * @return the games
     */
    @JsonManagedReference
    @XmlTransient
    public List<GameEntity> getGames() {
        return games;
    }

    /**
     * @param games the games to set
     */
    @JsonManagedReference
    public void setGames(List<GameEntity> games) {
        this.games = games;
    }

    /**
     *
     * @param game
     */
    public void addGame(GameEntity game) {
        this.games.add(game);
        game.setGameModel(this);
    }

    /**
     * @return the widgets
     */
    @JsonManagedReference("gamemodel-widget")
    @XmlTransient
    public List<WidgetEntity> getWidgets() {
        return widgets;
    }

    /**
     * @param widgets the widgets to set
     */
    @JsonManagedReference("gamemodel-widget")
    public void setWidgets(List<WidgetEntity> widgets) {
        this.widgets = widgets;
    }

    /**
     * @return the cssUri
     */
    public String getCssUri() {
        return cssUri;
    }

    /**
     * @param cssUri the cssUri to set
     */
    public void setCssUri(String cssUri) {
        this.cssUri = cssUri;
    }

    /**
     * @return the widgetsUri
     */
    public String getWidgetsUri() {
        return widgetsUri;
    }

    /**
     * @param widgetsUri the widgetsUri to set
     */
    public void setWidgetsUri(String widgetsUri) {
        this.widgetsUri = widgetsUri;
    }
}
