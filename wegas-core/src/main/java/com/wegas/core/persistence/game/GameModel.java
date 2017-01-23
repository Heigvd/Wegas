/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.fasterxml.jackson.annotation.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.Pages;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.BroadcastTarget;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.persistence.User;

import javax.jcr.RepositoryException;
import javax.persistence.*;
import java.util.*;
import java.util.Map.Entry;
import javax.validation.constraints.Pattern;
import org.apache.shiro.SecurityUtils;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
//@Table(uniqueConstraints =
//        @UniqueConstraint(columnNames = "name"))
@JsonIgnoreProperties(ignoreUnknown = true)
@NamedQueries({
    @NamedQuery(name = "GameModel.findByStatus", query = "SELECT a FROM GameModel a WHERE a.status = :status ORDER BY a.name ASC"),
    @NamedQuery(name = "GameModel.findDistinctChildrenLabels", query = "SELECT DISTINCT(child.label) FROM VariableDescriptor child WHERE child.rootGameModel.id = :containerId"),
    @NamedQuery(name = "GameModel.findByName", query = "SELECT a FROM GameModel a WHERE a.name = :name"),
    @NamedQuery(name = "GameModel.findAll", query = "SELECT gm FROM GameModel gm")})
public class GameModel extends NamedEntity implements DescriptorListI<VariableDescriptor>, BroadcastTarget {

    private static final long serialVersionUID = 1L;

    @Transient
    private Boolean canView = null;
    @Transient
    private Boolean canEdit = null;
    @Transient
    private Boolean canInstantiate = null;
    @Transient
    private Boolean canDuplicate = null;

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
    @Pattern(regexp = "^.*\\S+.*$", message = "GameModel name cannot be empty")// must at least contains one non-whitespace character
    private String name;

    /**
     *
     */
    @Lob
    //@Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    private String description;

    /**
     *
     */
    @Enumerated(value = EnumType.STRING)
    @Column(length = 24)
    private Status status = Status.LIVE;

    /**
     *
     */
    @Lob
    //@Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    private String comments;

    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdTime = new Date();

    /**
     *
     */
    @ManyToOne(fetch = FetchType.LAZY)
    //@XmlTransient
    @JsonIgnore
    private User createdBy;

    /*
     *
     * //@XmlTransient
     *
     * @JsonIgnore private Boolean template = true;
     */
    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL}, orphanRemoval = true, fetch = FetchType.LAZY)
    //@XmlTransient
    @JsonIgnore
    private List<VariableDescriptor> variableDescriptors = new ArrayList<>();

    /**
     * A list of Variable Descriptors that are at the root level of the
     * hierarchy (other VariableDescriptor can be placed inside of a
     * ListDescriptor's items List).
     */
    @OneToMany(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @JoinColumn(name = "rootgamemodel_id")
    @OrderColumn
    @JsonView(Views.Export.class)
    //@JsonManagedReference
    private List<VariableDescriptor> childVariableDescriptors = new ArrayList<>();

    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL}, orphanRemoval = true, fetch = FetchType.LAZY)
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
    @JsonView({Views.Export.class})
    private Map<String, GameModelContent> clientScriptLibrary = new HashMap<>();

    /**
     *
     */
    @Embedded
    private GameModelProperties properties = new GameModelProperties();

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
    public GameModel() {
    }

    /**
     * @param name
     */
    public GameModel(String name) {
        this.name = name;
    }

    /**
     * @param pageMap
     * @throws RepositoryException
     */
    @JsonCreator
    public GameModel(@JsonProperty("pages") JsonNode pageMap) throws RepositoryException {
        Map<String, JsonNode> map = new HashMap<>();
        if (pageMap == null) {
            return;
        }
        String curKey;
        Iterator<String> iterator = pageMap.fieldNames();
        while (iterator.hasNext()) {
            curKey = iterator.next();
            map.put(curKey, pageMap.get(curKey));
        }
        this.setPages(map);
    }

    /**
     * @param context
     */
    public void propagateDefaultInstance(AbstractEntity context, boolean create) {
        for (VariableDescriptor vd : this.getVariableDescriptors()) {
            vd.propagateDefaultInstance(context, create);
        }
    }

    /**
     *
     */
    public void propagateGameModel() {
        //this.variableDescriptors.clear();
        this.propagateGameModel(this);
    }

    public void addToVariableDescriptors(VariableDescriptor vd) {
        if (!this.getVariableDescriptors().contains(vd)) {
            this.getVariableDescriptors().add(vd);
            vd.setGameModel(this);
        }
    }

    public void removeFromVariableDescriptors(VariableDescriptor vd) {
        this.getVariableDescriptors().remove(vd);
    }

    /**
     * @param list
     */
    private void propagateGameModel(final DescriptorListI<? extends VariableDescriptor> list) {
        for (VariableDescriptor vd : list.getItems()) {
            this.addToVariableDescriptors(vd);
            if (vd instanceof DescriptorListI) {
                this.propagateGameModel((DescriptorListI<? extends VariableDescriptor>) vd);
            }
        }
    }

    @Override
    public void merge(AbstractEntity n) {
        if (n instanceof GameModel) {
            GameModel other = (GameModel) n;
            this.setDescription(other.getDescription());                            // Set description first, since fetching this lazy loaded attribute will cause an entity refresh
            this.setComments(other.getComments());
            this.getProperties().merge(other.getProperties());
            super.merge(n);
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + n.getClass().getSimpleName() + ") is not possible");
        }
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
     * @return true if current user has view permission on this
     */
    @JsonView(Views.IndexI.class)
    public Boolean getCanView() {
        if (canView != null) {
            return canView;
        } else {
            // I DO NOT LIKE VERY MUCH USING SHIRO WITHIN ENTITIES...
            return SecurityUtils.getSubject().isPermitted("GameModel:View:gm" + this.id);
        }
    }

    /**
     * @return true if current user has edit permission on this
     */
    @JsonView(Views.IndexI.class)
    public Boolean getCanEdit() {
        if (canEdit != null) {
            return canEdit;
        } else {
            // I DO NOT LIKE VERY MUCH USING SHIRO WITHIN ENTITIES...
            return SecurityUtils.getSubject().isPermitted("GameModel:Edit:gm" + this.id);
        }
    }

    /**
     * @return true if current user has duplicate permission on this
     */
    @JsonView(Views.IndexI.class)
    public Boolean getCanDuplicate() {
        if (canDuplicate != null) {
            return canDuplicate;
        } else {
            // I DO NOT LIKE VERY MUCH USING SHIRO WITHIN ENTITIES...
            return SecurityUtils.getSubject().isPermitted("GameModel:Duplicate:gm" + this.id);
        }
    }

    /**
     * @return true if current user has instantiate permission on this
     */
    @JsonView(Views.IndexI.class)
    public Boolean getCanInstantiate() {
        if (canInstantiate != null) {
            return canInstantiate;
        } else {
            // I DO NOT LIKE VERY MUCH USING SHIRO WITHIN ENTITIES...
            return SecurityUtils.getSubject().isPermitted("GameModel:Instantiate:gm" + this.id);
        }
    }

    public void setCanView(Boolean canView) {
        this.canView = canView;
    }

    public void setCanEdit(Boolean canEdit) {
        this.canEdit = canEdit;
    }

    public void setCanInstantiate(Boolean canInstantiate) {
        this.canInstantiate = canInstantiate;
    }

    public void setCanDuplicate(Boolean canDuplicate) {
        this.canDuplicate = canDuplicate;
    }

    @Override
    public Long getId() {
        return id;
    }

    /**
     * @param id
     */
    public void setId(Long id) {
        this.id = id;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return Current GameModel's status
     */
    @JsonIgnore
    public Status getStatus() {
        return status;
    }

    /**
     * @param status status to set
     */
    @JsonIgnore
    public void setStatus(Status status) {
        this.status = status;
    }

    /**
     * @return all variable descriptors
     */
    @JsonIgnore
    public List<VariableDescriptor> getVariableDescriptors() {
        return variableDescriptors;
    }

    /**
     * @param variableDescriptors
     */
    public void setVariableDescriptors(List<VariableDescriptor> variableDescriptors) {
        this.variableDescriptors = new ArrayList<>();
        for (VariableDescriptor vd : variableDescriptors) {
            this.addToVariableDescriptors(vd);
        }
    }

    /**
     * @return a list of Variable Descriptors that are at the root level of the
     *         hierarchy (other VariableDescriptor can be placed inside of a
     *         ListDescriptor's items List)
     */
    public List<VariableDescriptor> getChildVariableDescriptors() {
        return childVariableDescriptors;
    }

    /**
     * @param variableDescriptors
     */
    public void setChildVariableDescriptors(List<VariableDescriptor> variableDescriptors) {
        this.childVariableDescriptors = new ArrayList<>();
        for (VariableDescriptor vd : variableDescriptors) {
            this.addItem(vd);
        }
    }

    @Override
    public void addItem(VariableDescriptor variableDescriptor) {
        this.getChildVariableDescriptors().add(variableDescriptor);
        this.getVariableDescriptors().add(variableDescriptor);
        variableDescriptor.setGameModel(this);
        variableDescriptor.setRootGameModel(this);
    }

    @Override
    public void addItem(int index, VariableDescriptor variableDescriptor) {
        this.getChildVariableDescriptors().add(index, variableDescriptor);
        this.getVariableDescriptors().add(variableDescriptor);
        variableDescriptor.setGameModel(this);
        variableDescriptor.setRootGameModel(this);
    }

    /**
     * @return the games
     */
    @JsonIgnore
    public List<Game> getGames() {
        Collections.sort(this.games, new Comparator<Game>() {
            @Override
            public int compare(Game g1, Game g2) {
                return g1.getCreatedTime().compareTo(g2.getCreatedTime());
            }
        });
        return this.games;
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
     * @param game
     */
    public void addGame(Game game) {
        this.getGames().add(game);
        game.setGameModel(this);
        //game.setGameModelId(this.getId());
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
     * @return all players from all teams and all games
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
        return (createdTime != null ? new Date(createdTime.getTime()) : null);
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * @return the properties
     */
    public GameModelProperties getProperties() {
        return this.properties;
    }

    /**
     * @param properties the properties to set
     */
    public void setProperties(GameModelProperties properties) {
        this.properties = properties;
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
        try (final Pages pagesDAO = new Pages(this.id.toString())) {
            return pagesDAO.getPagesContent();
        } catch (RepositoryException ex) {
            return new HashMap<>();
        }
    }

    /**
     * @param pageMap
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
    }

    @Override
    public int size() {
        return this.getChildVariableDescriptors().size();
    }

    @Override
    public VariableDescriptor item(int index) {
        return this.getChildVariableDescriptors().get(index);
    }

    @Override
    public boolean remove(VariableDescriptor item) {
        this.getVariableDescriptors().remove(item);
        return this.getChildVariableDescriptors().remove(item);

    }

    @PostPersist
    private void storePages() {
        if (this.pages != null) {
            try (final Pages pagesDAO = new Pages(this.id.toString())) {
                pagesDAO.delete();                                              // Remove existing pages
                // Pay Attention: this.pages != this.getPages() ! 
                // this.pages contains deserialized pages, getPages() fetchs them from the jackrabbit repository
                for (Entry<String, JsonNode> p : this.pages.entrySet()) {       // Add all pages
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

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
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

    /**
     * @return name of the user who created this or null if user no longer
     *         exists
     */
    public String getCreatedByName() {
        if (this.getCreatedBy() != null) {
            return this.getCreatedBy().getName();
        }
        return null;
    }

    /**
     * @param createdByName
     */
    public void setCreatedByName(String createdByName) {
        // Here so game deserialization works
    }

    /**
     * @return the template
     */
    public Boolean getTemplate() {
        return status != Status.PLAY;
    }

    /**
     * @param template the template to set public void setTemplate(Boolean
     *                 template) { this.template = template; }
     */
    /**
     * TODO: select game.* FROM GAME where dtype like 'DEBUGGAME' and
     * gamemodelid = this.getId()
     *
     * @return true if the gameModel has a DebugGame
     */
    public boolean hasDebugGame() {
        for (Game g : getGames()) {
            if (g instanceof DebugGame) {
                return true;
            }
        }
        return false;
    }

    @Override
    @JsonIgnore
    public String getChannel() {
        return "GameModel-" + getId();
    }

    /*@Override
    public Map<String, List<AbstractEntity>> getEntities() {
        Map<String, List<AbstractEntity>> map = new HashMap<>();
        ArrayList<AbstractEntity> entities = new ArrayList<>();
        entities.add(this);
        map.put(this.getChannel(), entities);
        return map;
    }*/
    public enum Status {
        /**
         * Not a template game model but one linked to an effective game
         */
        PLAY,
        /**
         * Template GameModel
         */
        LIVE,
        /**
         * Template GameModel in the wast bin
         */
        BIN,
        /**
         * Template GameModel Scheduled for deletion
         */
        DELETE,
        /**
         * Does not exist anymore. Actually, this status should never persist.
         * Used internally as game's missing.
         */
        SUPPRESSED
    }

    /* try transient anotation on field "pages". Problem with anotation mixin'
     private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
     in.defaultReadObject();
     this.pages = new HashMap<>();
     }*/
}
