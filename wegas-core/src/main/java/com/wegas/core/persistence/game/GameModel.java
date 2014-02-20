/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.Pages;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.persistence.User;
import java.util.*;
import java.util.Map.Entry;
import javax.jcr.RepositoryException;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import org.apache.shiro.SecurityUtils;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.annotate.JsonCreator;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonManagedReference;
import org.codehaus.jackson.annotate.JsonProperty;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
//@Table(uniqueConstraints =
//        @UniqueConstraint(columnNames = "name"))
@JsonIgnoreProperties(ignoreUnknown = true)
public class GameModel extends NamedEntity implements DescriptorListI<VariableDescriptor> {

    public enum PROPERTY {

        websocket,
        freeForAll
    }
    /**
     *
     */
    @Id
    @Column(name = "gamemodelid")
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     *
     */
    @Basic(optional = false)
    //@Pattern(regexp = "^\\w+$")
    //@XmlID
    private String name;
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
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdTime = new Date();
    /**
     *
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @XmlTransient
    @JsonIgnore
    private User createdBy;
    /**
     *
     */
    @XmlTransient
    @JsonIgnore
    private Boolean template = true;
    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL}, orphanRemoval = true, fetch = FetchType.LAZY)
    @XmlTransient
    private List<VariableDescriptor> variableDescriptors;
    /**
     * A list of Variable Descriptors that are at the root level of the
     * hierarchy (other VariableDescriptor can be placed inside of a
     * ListDescriptor's items List).
     */
    @OneToMany(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @JoinColumn(name = "rootgamemodel_id")
    @JsonView(Views.Export.class)
    //@JsonManagedReference
    @OrderColumn
    private List<VariableDescriptor> childVariableDescriptors;
    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL}, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdTime")
    @JsonManagedReference
    @JsonIgnore
    //@JsonView(Views.ExportI.class)
    private List<Game> games = new ArrayList<>();
    /**
     * Holds all the scripts contained in current game model.
     */
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "scriptlibrary_gamemodelid")
    @JsonView({Views.Export.class})
    private Map<String, GameModelContent> scriptLibrary = new HashMap<>();
    /**
     *
     */
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "csslibrary_gamemodelid")
    @JsonView({Views.Export.class})
    private Map<String, GameModelContent> cssLibrary = new HashMap<>();
    /**
     *
     */
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "clientscriptlibrary_gamemodelid")
    //@ElementCollection(fetch = FetchType.LAZY)
    @JsonView({Views.Export.class})
    private Map<String, GameModelContent> clientScriptLibrary = new HashMap<>();
    /**
     *
     */
    @ElementCollection(fetch = FetchType.LAZY)
    private Map<String, String> properties = new HashMap<>();
    /**
     * Holds a reference to the pages, used to serialize page and game model at
     * the same time.
     */
    @Transient
    @JsonView({Views.Export.class})
    private Map<String, JsonNode> pages;

    /**
     *
     */
//    @ManyToOne(optional = true)
//    private GameModel parentGameModel;
    /**
     *
     */
    public GameModel() {
    }

    /**
     *
     * @param name
     */
    public GameModel(String name) {
        this.name = name;
    }

    @JsonCreator
    public GameModel(@JsonProperty("pages") JsonNode pageMap) throws RepositoryException {
        Map<String, JsonNode> map = new HashMap<>();
        if (pageMap == null) {
            return;
        }
        String curKey;
        Iterator<String> iterator = pageMap.getFieldNames();
        while (iterator.hasNext()) {
            curKey = iterator.next();
            map.put(curKey, pageMap.get(curKey));
        }
        this.setPages(map);
    }

//    public GameModel getParentGameModel() {
//        return parentGameModel;
//    }
//
//    public void setParentGameModel(GameModel parentGameModel) {
//        this.parentGameModel = parentGameModel;
//    }
    /**
     *
     * @param force
     */
    public void propagateDefaultInstance(boolean force) {
        for (VariableDescriptor vd : this.getVariableDescriptors()) {
            vd.propagateDefaultInstance(force);
        }
    }

    @Override
    public void merge(AbstractEntity n) {
        GameModel other = (GameModel) n;
        this.setDescription(other.getDescription());                            // Set description first, since fetching this lazy loaded attribute will cause an entity refresh

        super.merge(n);
        this.properties.clear();
        this.properties.putAll(other.getProperties());

        //this.setParentGameModel(other.getParentGameModel());
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        this.setCreatedTime(new Date());
    }

    /**
     * For serialization
     *
     * @return
     */
    @JsonView(Views.IndexI.class)
    public Boolean getCanView() {
        return SecurityUtils.getSubject().isPermitted("GameModel:View:gm" + this.id);
    }

    @JsonView(Views.IndexI.class)
    public Boolean getCanEdit() {
        return SecurityUtils.getSubject().isPermitted("GameModel:Edit:gm" + this.id);
    }

    @JsonView(Views.IndexI.class)
    public Boolean getCanDuplicate() {
        return SecurityUtils.getSubject().isPermitted("GameModel:Duplicate:gm" + this.id);
    }

    @JsonView(Views.IndexI.class)
    public Boolean getCanInstantiate() {
        return SecurityUtils.getSubject().isPermitted("GameModel:Instantiate:gm" + this.id);
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
//    @Override
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
    public List<VariableDescriptor> getVariableDescriptors() {
        return variableDescriptors;
    }

    /**
     *
     * @param variableDescriptors
     */
    public void setVariableDescriptors(List<VariableDescriptor> variableDescriptors) {
        this.variableDescriptors = variableDescriptors;
    }

    /**
     *
     * @return a list of Variable Descriptors that are at the root level of the
     * hierarchy (other VariableDescriptor can be placed inside of a
     * ListDescriptor's items List)
     */
    public List<VariableDescriptor> getChildVariableDescriptors() {
        return childVariableDescriptors;
    }

    /**
     *
     * @param variableDescriptors
     */
    public void setChildVariableDescriptors(List<VariableDescriptor> variableDescriptors) {
        this.childVariableDescriptors = variableDescriptors;
        this.variableDescriptors = variableDescriptors;
        for (VariableDescriptor vd : variableDescriptors) {
            vd.setGameModel(this);
        }
    }

    /**
     *
     * @param variableDescriptor
     */
    @Override
    public void addItem(VariableDescriptor variableDescriptor) {
        this.childVariableDescriptors.add(variableDescriptor);
        this.variableDescriptors.add(variableDescriptor);
        variableDescriptor.setGameModel(this);
    }

    @Override
    public void addItem(int index, VariableDescriptor variableDescriptor) {
        this.childVariableDescriptors.add(index, variableDescriptor);
        this.variableDescriptors.add(variableDescriptor);
        variableDescriptor.setGameModel(this);
    }

    /**
     * @return the games
     */
    @XmlTransient
    public List<Game> getGames() {
        return games;
    }

    /**
     * @param games the games to set
     */
    public void setGames(List<Game> games) {
        this.games = games;
        for (Game g : games) {
            g.setGameModel(this);
        }
    }

    /**
     *
     * @param game
     */
    public void addGame(Game game) {
        this.games.add(game);
        game.setGameModel(this);
    }

    /**
     * @return the scriptLibrary
     */
    public Map<String, GameModelContent> getScriptLibrary() {
        return scriptLibrary;
    }

    /**
     * @param scriptLibrary the scriptLibrary to set
     */
    public void setScriptLibrary(Map<String, GameModelContent> scriptLibrary) {
        this.scriptLibrary = scriptLibrary;
    }

    /**
     *
     * @return
     */
    @JsonIgnore
    public List<Player> getPlayers() {
        List<Player> players = new ArrayList<>();
        for (Game g : this.getGames()) {
            players.addAll(g.getPlayers());
        }
        return players;
    }

    /**
     * @return the createdTime
     */
    public Date getCreatedTime() {
        return createdTime;
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime;
    }

    /**
     * @return the properties
     */
    public Map<String, String> getProperties() {
        return properties;
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
     * @return
     */
    public String getProperty(String key) {
        return this.properties.get(key);
    }

    /**
     *
     * @param key
     * @param value
     */
    public void setProperty(String key, String value) {
        this.properties.put(key, value);
    }

    public Boolean hasProperty(PROPERTY p) {
        return this.properties.containsKey(p.toString());
    }

    /**
     * @return the cssLibrary
     */
    public Map<String, GameModelContent> getCssLibrary() {
        return cssLibrary;
    }

    /**
     * @param cssLibrary the cssLibrary to set
     */
    public void setCssLibrary(Map<String, GameModelContent> cssLibrary) {
        this.cssLibrary = cssLibrary;
    }

    /**
     * @return the clientScriptLibrary
     */
    public Map<String, GameModelContent> getClientScriptLibrary() {
        return clientScriptLibrary;
    }

    /**
     * @param clientScriptLibrary the clientScriptLibrary to set
     */
    public void setClientScriptLibrary(Map<String, GameModelContent> clientScriptLibrary) {
        this.clientScriptLibrary = clientScriptLibrary;
    }

    /**
     * @return the pages
     */
    public Map<String, JsonNode> getPages() {
        try {
            final Pages pagesDAO = new Pages(this.id.toString());
            return pagesDAO.getPages();
        } catch (RepositoryException ex) {
            return new HashMap<>();
        }
    }

    /**
     *
     * @param pageMap
     * @throws RepositoryException
     */
    public final void setPages(Map<String, JsonNode> pageMap) {
        this.pages = pageMap;
        if (this.id != null) {
            this.storePages();
        }
    }

    @Override
    @JsonIgnore
    public List<VariableDescriptor> getItems() {
        return this.getChildVariableDescriptors();
    }

    @Override
    @JsonIgnore
    public void setItems(List<VariableDescriptor> items) {
        this.setChildVariableDescriptors(items);
        this.addItem(null);
    }

    @Override
    public int size() {
        return this.childVariableDescriptors.size();
    }

    @Override
    public VariableDescriptor item(int index) {
        return this.childVariableDescriptors.get(index);
    }

    @Override
    public boolean remove(VariableDescriptor item) {
        return this.childVariableDescriptors.remove(item);
    }

    @PostPersist
    private void storePages() {
        if (this.pages != null) {
            try {
                Pages pagesDAO = new Pages(this.id.toString());
                pagesDAO.delete();                                                  // Remove existing pages
                for (Entry<String, JsonNode> p : this.pages.entrySet()) {             // Add all pages
                    pagesDAO.store(new Page(p.getKey(), p.getValue()));
                }

            } catch (RepositoryException ex) {
                System.err.println("Failed to create repository for GameModel " + this.id);
            }
        }

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
     * @return the createdBy
     */
    @JsonIgnore
    public User getCreatedBy() {
        return createdBy;
    }

    /**
     * @param createdBy the createdBy to set
     */
    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatedByName() {
        if (this.getCreatedBy() != null) {
            return this.getCreatedBy().getName();
        }
        return null;
    }

    /**
     *
     */
    public void setCreatedByName(String createdByName) {
        // Here so game deserialization works
    }

    /**
     * @return the template
     */
    public Boolean getTemplate() {
        return template;
    }

    /**
     * @param template the template to set
     */
    public void setTemplate(Boolean template) {
        this.template = template;
    }
}
