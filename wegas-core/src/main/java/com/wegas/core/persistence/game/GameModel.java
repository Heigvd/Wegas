/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.INTERNAL;
import ch.albasim.wegas.annotations.ProtectionLevel;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.jta.JCRClient;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.Pages;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.WegasEntityPermission;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.ValueGenerators.GmProperties;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.NumberView;
import com.wegas.editor.View.StringView;
import com.wegas.editor.View.Textarea;
import java.util.*;
import java.util.Map.Entry;
import javax.jcr.RepositoryException;
import javax.persistence.*;
import javax.validation.constraints.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
//@Table(uniqueConstraints =
//        @UniqueConstraint(columnNames = "name"))
@JsonIgnoreProperties(ignoreUnknown = true)
@NamedQuery(
        name = "GameModel.findIdById",
        query = "SELECT gm.id FROM GameModel gm WHERE gm.id = :gameModelId"
)
@NamedQuery(
        name = "GameModel.findByTypeAndStatus",
        query = "SELECT a FROM GameModel a WHERE a.status = :status AND a.type = :type ORDER BY a.name ASC"
)
@NamedQuery(
        name = "GameModel.findDistinctLogIds",
        query = "SELECT DISTINCT(gm.properties.logID) FROM GameModel gm"
)
@NamedQuery(
        name = "GameModel.findDistinctChildrenLabels",
        query = "SELECT DISTINCT(child.label) FROM VariableDescriptor child WHERE child.root.id = :containerId"
)
@NamedQuery(
        name = "GameModel.findByName",
        query = "SELECT a FROM GameModel a WHERE a.name = :name AND a.type = com.wegas.core.persistence.game.GameModel.GmType.SCENARIO"
)
@NamedQuery(
        name = "GameModel.countByName",
        query = "SELECT count(gm.id) FROM GameModel gm WHERE gm.name = :name AND gm.type = com.wegas.core.persistence.game.GameModel.GmType.SCENARIO"
)
@NamedQuery(
        name = "GameModel.countModelByName",
        query = "SELECT count(gm.id) FROM GameModel gm WHERE gm.name = :name AND gm.type = com.wegas.core.persistence.game.GameModel.GmType.MODEL"
)
@NamedQuery(
        name = "GameModel.findAll",
        query = "SELECT gm FROM GameModel gm WHERE gm.type = com.wegas.core.persistence.game.GameModel.GmType.SCENARIO"
)
@NamedQuery(
        name = "GameModel.findAllInstantiations",
        query = "SELECT gm FROM GameModel gm where gm.basedOn.id = :id"
)
@Table(
        indexes = {
            @Index(columnList = "createdby_id"),
            @Index(columnList = "basedon_id")
        }
)
public class GameModel extends AbstractEntity implements DescriptorListI<VariableDescriptor>, InstanceOwner, Broadcastable, NamedEntity, JCRClient {

    private static final Logger logger = LoggerFactory.getLogger(GameModel.class);

    private static final long serialVersionUID = 1L;

    @Transient
    private Boolean onGoingPropagation = false;

    @Transient
    @JsonIgnore
    private JCRConnectorProvider jcrProvider;

    /**
     *
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     *
     */
    @Basic(optional = false)
    @Pattern(regexp = "^.*\\S+.*$", message = "GameModel name cannot be empty")// must at least contains one non-whitespace character
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "Name"))
    private String name;

    @Basic(optional = false)
    @Column(columnDefinition = "int not null default 1")
    @WegasEntityProperty(initOnly = true,
            optional = false, nullable = false,
            view = @View(label = "UI Version", readOnly = true, value = NumberView.class))
    private Integer UIVersion;

    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @WegasEntityProperty(includeByDefault = false,
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(label = "Languages", value = Hidden.class))
    private List<GameModelLanguage> languages = new ArrayList<>();

    /**
     *
     */
    @Lob
    //@Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    @WegasEntityProperty(sameEntityOnly = true,
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "Description"))
    private String description;

    /**
     *
     */
    @Column(length = 24, columnDefinition = "character varying(24) default 'LIVE'::character varying")
    @Enumerated(value = EnumType.STRING)
    private Status status = Status.LIVE;

    @Column(length = 24, columnDefinition = "character varying(24) default 'SCENARIO'::character varying")
    @Enumerated(value = EnumType.STRING)
    private GmType type = GmType.SCENARIO;

    /**
     *
     */
    @Lob
    //@Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    @WegasEntityProperty(sameEntityOnly = true,
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "Comments", value = Textarea.class))
    private String comments;

    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date createdTime = new Date();

    /**
     *
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private User createdBy;

    /**
     * Link to original gameModel for "PLAY" gameModel
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private GameModel basedOn;

    @Column(name = "basedon_id", insertable = false, updatable = false, columnDefinition = "bigint")
    private Long basedOnId;

    /**
     *
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL}, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private Collection<VariableDescriptor> variableDescriptors = new LinkedList<>();

    /**
     * A list of Variable Descriptors that are at the root level of the
     * hierarchy (other VariableDescriptor can be placed inside of a
     * ListDescriptor's items List).
     */
    @OneToMany(mappedBy = "root", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @OrderColumn(name = "gm_items_order")
    //@JsonManagedReference
    @WegasEntityProperty(includeByDefault = false, notSerialized = true)
    private List<VariableDescriptor> items = new ArrayList<>();

    /**
     * All gameModelScoped instances
     */
    @JsonIgnore
    @OneToMany(mappedBy = "gameModel", cascade = CascadeType.ALL)
    private List<VariableInstance> privateInstances = new ArrayList<>();

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
    @OneToMany(mappedBy = "scriptlibrary_GameModel", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonView({Views.ExportI.class})
    @WegasEntityProperty(includeByDefault = false, notSerialized = true)
    private List<GameModelContent> scriptLibrary = new ArrayList<>();

    /**
     *
     */
    @OneToMany(mappedBy = "csslibrary_GameModel", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonView({Views.ExportI.class})
    @WegasEntityProperty(includeByDefault = false, notSerialized = true)
    private List<GameModelContent> cssLibrary = new ArrayList<>();

    /**
     *
     */
    @OneToMany(mappedBy = "clientscriptlibrary_GameModel", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonView({Views.ExportI.class})
    @WegasEntityProperty(includeByDefault = false, notSerialized = true)
    private List<GameModelContent> clientScriptLibrary = new ArrayList<>();

    /**
     *
     */
    @Embedded
    @WegasEntityProperty(optional = false, nullable = false, proposal = GmProperties.class)
    private GameModelProperties properties = new GameModelProperties();

    /**
     * Holds a reference to the pages, used to serialize page and game model at
     * the same time.
     */
    @Transient
    @WegasEntityProperty(includeByDefault = false, protectionLevel = ProtectionLevel.ALL, notSerialized = true)
    @JsonView({Views.ExportI.class})
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
     *
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
     * Set the gameModel this PLAY gameModel is based on
     *
     * @param srcGameModel the original game model this gameModel is a duplicata of
     */
    public void setBasedOn(GameModel srcGameModel) {
        this.basedOn = srcGameModel;
        if (this.basedOn != null) {
            this.basedOnId = this.basedOn.getId();
        } else {
            this.basedOnId = null;
        }
    }

    /**
     * Returns the original game model this gameModel is a duplicata of
     *
     * @return the original game model
     */
    public GameModel getBasedOn() {
        return this.basedOn;
    }

    /**
     *
     * @return
     */
    @WegasExtraProperty(view = @View(label = "based on", value = Hidden.class, featureLevel = INTERNAL))
    public Long getBasedOnId() {
        return this.basedOnId;
    }

    public void setBasedOnId(Long id) {
        // jsonIgnore
    }

    /**
     * Register new descriptor within the main descriptor list
     * Method do nothing id descriptor is already registered
     *
     * @param vd the new descriptor to register
     */
    public void addToVariableDescriptors(VariableDescriptor vd) {
        if (!this.getVariableDescriptors().contains(vd)) {
            this.getVariableDescriptors().add(vd);
            vd.setGameModel(this);
        }
    }

    /**
     * Remove
     *
     * @param vd
     */
    public void removeFromVariableDescriptors(VariableDescriptor vd) {
        this.getVariableDescriptors().remove(vd);
    }

    /**
     * Make sure all variableDescriptors in the gameModel are registered in the gamemodel variableDescriptors list
     */
    public void propagateGameModel() {
        //this.variableDescriptors.clear();
        this.propagateGameModel(this);
    }

    /**
     * Make sur all descriptor (in the given list, deep) a registered within the main descriptor list
     *
     * @param list base list to fetch new descriptor from
     */
    private void propagateGameModel(final DescriptorListI<? extends VariableDescriptor> list) {
        for (VariableDescriptor vd : list.getItems()) {
            this.addToVariableDescriptors(vd);
            if (vd instanceof DescriptorListI) {
                this.propagateGameModel((DescriptorListI<? extends VariableDescriptor>) vd);
            }
        }
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        if (this.getUIVersion() == null) {
            this.setUIVersion(1);
        }
        this.setCreatedTime(new Date());
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

    public Integer getUIVersion() {
        return UIVersion;
    }

    public void setUIVersion(Integer UIVersion) {
        this.UIVersion = UIVersion;
    }

    /**
     * @return Current GameModel's status
     */
    @WegasExtraProperty(
            optional = true, nullable = false,
            view = @View(
                    label = "Type",
                    readOnly = true,
                    value = StringView.class
            )
    )
    public Status getStatus() {
        return status;
    }

    /**
     * Change the status of the gameModel.
     *
     * @param status status to set
     */
    public void setStatus(Status status) {
        if (status == Status.DELETE) {
            logger.error("SET GM {} STATUS TO DELETE", this);
            Helper.printWegasStackTrace(WegasErrorMessage.error("Setting gm status to DELETE"));
        }
        this.status = status;
    }

    /**
     * get the set of all descriptor from the game model
     *
     * @return all variable descriptors
     */
    @JsonIgnore
    public Collection<VariableDescriptor> getVariableDescriptors() {
        return variableDescriptors;
    }

    /**
     * @param variableDescriptors
     */
    public void setVariableDescriptors(Set<VariableDescriptor> variableDescriptors) {
        this.variableDescriptors = new HashSet<>();
        for (VariableDescriptor vd : variableDescriptors) {
            this.addToVariableDescriptors(vd);
        }
    }

    @Override
    public List<VariableInstance> getPrivateInstances() {
        return privateInstances;
    }

    @Override
    public List<VariableInstance> getAllInstances() {
        List<VariableInstance> instances = new ArrayList<>();
        instances.addAll(getPrivateInstances());
        for (Game g : getGames()) {
            for (Team t : g.getTeams()) {
                instances.addAll(t.getAllInstances());
            }
        }
        return instances;
    }

    public void setPrivateInstances(List<VariableInstance> privateInstances) {
        this.privateInstances = privateInstances;
    }

    /**
     * @return a list of Variable Descriptors that are at the root level of the
     *         hierarchy (other VariableDescriptor can be placed inside of a
     *         ListDescriptor's items List)
     */
    @JsonIgnore
    public List<VariableDescriptor> getChildVariableDescriptors() {
        return this.getItems();
    }

    /**
     * @param variableDescriptors
     */
    @JsonProperty
    public void setChildVariableDescriptors(List<VariableDescriptor> variableDescriptors) {
        this.setItems(variableDescriptors);
    }

    @Override
    public void setChildParent(VariableDescriptor child) {
        child.setRoot(this);
    }

    /**
     * @return the games
     */
    @JsonIgnore
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
    @JsonIgnore
    public List<GameModelContent> getScriptLibraryList() {
        return scriptLibrary;
    }

    /**
     * @param scriptLibrary the scriptLibrary to set
     */
    @JsonIgnore
    public void setScriptLibraryList(List<GameModelContent> scriptLibrary) {
        this.scriptLibrary = scriptLibrary;
    }

    /**
     * @return all players from all teams and all games
     */
    @JsonIgnore
    @Override
    public List<Player> getPlayers() {
        List<Player> players = new ArrayList<>();
        for (Game g : this.getGames()) {
            players.addAll(g.getPlayers());
        }
        return players;
    }

    @Override
    @JsonIgnore
    public Player getAnyLivePlayer() {
        for (Game game : this.getGames()) {
            Player p = game.getAnyLivePlayer();
            if (p != null) {
                return p;
            }
        }
        return null;
    }

    /**
     * Return a test player.
     * It may be a player in any team of a DebugGame or a player in a DebugTeam
     *
     * @return testPlayer
     */
    @JsonIgnore
    public Player findTestPlayer() {
        Player p = null;
        for (Game game : this.getGames()) {
            if (game instanceof DebugGame) {
                p = game.getAnyLivePlayer();
                if (p != null) {
                    return p;
                }
            } else {
                for (Team team : game.getTeams()) {
                    if (team instanceof DebugTeam) {
                        p = team.getAnyLivePlayer();
                        if (p != null) {
                            return p;
                        }
                    }
                }
            }
        }
        return null;
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

    @JsonIgnore
    public Map<String, Map<String, GameModelContent>> getLibraries() {
        Map<String, Map<String, GameModelContent>> libraries = new HashMap<>();

        libraries.put("Script", this.getScriptLibrary());
        libraries.put("ClientScript", this.getClientScriptLibrary());
        libraries.put("CSS", this.getCssLibrary());

        return libraries;
    }

    public void setLibraries(Map<String, Map<String, GameModelContent>> libraries) {
        this.setScriptLibrary(libraries.get("Script"));
        this.setClientScriptLibrary(libraries.get("ClientScript"));
        this.setCssLibrary(libraries.get("CSS"));
    }

    /**
     * @return the cssLibrary
     */
    @JsonIgnore
    public List<GameModelContent> getCssLibraryList() {
        return cssLibrary;
    }

    /**
     * @param cssLibrary the cssLibrary to set
     */
    @JsonIgnore
    public void setCssLibraryList(List<GameModelContent> cssLibrary) {
        this.cssLibrary = cssLibrary;
    }

    private Map<String, GameModelContent> getLibraryAsMap(List<GameModelContent> library) {
        Map<String, GameModelContent> map = new HashMap<>();
        for (GameModelContent gmc : library) {
            map.put(gmc.getContentKey(), gmc);
        }
        return map;
    }

    public Map<String, GameModelContent> getCssLibrary() {
        return getLibraryAsMap(cssLibrary);
    }

    public void setCssLibrary(Map<String, GameModelContent> library) {
        this.cssLibrary = new ArrayList<>();
        for (Entry<String, GameModelContent> entry : library.entrySet()) {
            String key = entry.getKey();
            GameModelContent gmc = entry.getValue();
            gmc.setCsslibrary_GameModel(this);
            gmc.setContentKey(key);
            cssLibrary.add(gmc);
        }
    }

    /**
     * @return the clientScriptLibrary
     */
    @JsonIgnore
    public List<GameModelContent> getClientScriptLibraryList() {
        return clientScriptLibrary;
    }

    public Map<String, GameModelContent> getScriptLibrary() {
        return getLibraryAsMap(scriptLibrary);
    }

    public Map<String, GameModelContent> getClientScriptLibrary() {
        return getLibraryAsMap(clientScriptLibrary);
    }

    public void setScriptLibrary(Map<String, GameModelContent> library) {
        this.scriptLibrary = new ArrayList<>();
        for (Entry<String, GameModelContent> entry : library.entrySet()) {
            String key = entry.getKey();
            GameModelContent gmc = entry.getValue();
            gmc.setScriptlibrary_GameModel(this);
            gmc.setContentKey(key);
            scriptLibrary.add(gmc);
        }
    }

    public void setClientScriptLibrary(Map<String, GameModelContent> library) {
        this.clientScriptLibrary = new ArrayList<>();
        for (Entry<String, GameModelContent> entry : library.entrySet()) {
            String key = entry.getKey();
            GameModelContent gmc = entry.getValue();
            gmc.setClientscriptlibrary_GameModel(this);
            gmc.setContentKey(key);
            clientScriptLibrary.add(gmc);
        }
    }

    /**
     * @param key
     *
     * @return the clientScript matching the key or null
     */
    public GameModelContent getClientScript(String key) {
        return this.getGameModelContent(clientScriptLibrary, key);
    }

    /**
     * Add or update a client script.
     *
     * @param clientScript
     */
    public void setClientScript(GameModelContent clientScript) {
        GameModelContent cs = this.getClientScript(clientScript.getContentKey());
        if (cs != null) {
            cs.setContent(clientScript.getContent());
        } else {
            clientScript.setClientscriptlibrary_GameModel(this);
            clientScriptLibrary.add(clientScript);
        }
    }

    /**
     * @param key
     *
     * @return the clientScript matching the key or null
     */
    public GameModelContent getScript(String key) {
        return this.getGameModelContent(scriptLibrary, key);
    }

    /**
     * Add or update a client script.
     *
     * @param script
     */
    public void setScript(GameModelContent script) {
        GameModelContent s = this.getScript(script.getContentKey());
        if (s != null) {
            s.setContent(script.getContent());
        } else {
            script.setScriptlibrary_GameModel(this);
            scriptLibrary.add(script);
        }
    }

    /**
     * @param key
     *
     * @return the clientScript matching the key or null
     */
    public GameModelContent getCss(String key) {
        return this.getGameModelContent(cssLibrary, key);
    }

    /**
     * Add or update a stylesheet.
     *
     * @param css
     */
    public void setCss(GameModelContent css) {
        GameModelContent stylesheet = this.getCss(css.getContentKey());
        if (stylesheet != null) {
            stylesheet.setContent(css.getContent());
        } else {
            css.setCsslibrary_GameModel(this);
            cssLibrary.add(css);
        }
    }

    public GameModelContent getGameModelContent(List<GameModelContent> list, String key) {
        for (GameModelContent gmc : list) {
            if (gmc.getContentKey().equals(key)) {
                return gmc;
            }
        }
        return null;
    }

    /**
     * @param clientScriptLibrary the clientScriptLibrary to set
     */
    @JsonIgnore
    public void setClientScriptLibraryList(List<GameModelContent> clientScriptLibrary) {
        this.clientScriptLibrary = clientScriptLibrary;
    }

    /**
     * @return the pages
     */
    public Map<String, JsonNode> getPages() {
        // do not even try to fetch pages from repository if the gamemodel define a pagesURI
        if (Helper.isNullOrEmpty(getProperties().getPagesUri())) {
            if (this.pages != null) {
                // pages have been set but not yet save to repository
                return this.pages;
            } else if (this.getId() != null) {
                try {
                    Pages pagesDAO = this.jcrProvider.getPages(this);
                    try {
                        return pagesDAO.getPagesContent();
                    } finally {
                        if (!pagesDAO.getManaged()) {
                            pagesDAO.rollback();
                        }
                    }
                } catch (RepositoryException ex) {
                    logger.error("getPages() EXCEPTION {}", ex);
                }
            }
        }
        return new HashMap<>();
    }

    /**
     * @param pageMap
     */
    public final void setPages(Map<String, JsonNode> pageMap) {
        this.pages = pageMap;

        if (this.id != null) {
            // no id means not persisted
            // no id means no JCR repository
            // no repository means no store
            // let @PostPersist storePaged
            this.storePages();
        }
    }

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
    public void setItems(List<VariableDescriptor> items) {
        DescriptorListI.super.setItems(items);

        this.variableDescriptors.clear();
        this.propagateGameModel();

        /*
        this.items = new ArrayList<>();
        for (VariableDescriptor vd : items) {
            this.addItem(vd);
        }
         */
    }

    @Override
    @JsonIgnore
    public GameModel getGameModel() {
        return this;
    }

    @PostPersist
    private void storePages() {
        if (this.pages != null) {
            try {
                Pages pagesDAO = this.jcrProvider.getPages(this);
                pagesDAO.delete();                                              // Remove existing pages
                // Pay Attention: this.pages != this.getPages() !
                // this.pages contains deserialized pages, getPages() fetchs them from the jackrabbit repository
                for (Entry<String, JsonNode> p : this.pages.entrySet()) {       // Add all pages
                    pagesDAO.store(new Page(p.getKey(), p.getValue()));
                }
                // As soon as repository is up to date, clear local pages
                this.pages = null;
            } catch (RepositoryException ex) {
                logger.error("Failed to create repository for GameModel " + this.id);
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
    @JsonView(Views.EditorI.class)
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

    @WegasExtraProperty(
            optional = true, nullable = false,
            view = @View(label = "Type", value = StringView.class))
    public GmType getType() {
        return type;
    }

    public void setType(GmType type) {
        this.type = type;
    }

    @JsonIgnore
    public List<GameModelLanguage> getRawLanguages() {
        return this.languages;
    }

    public List<GameModelLanguage> getLanguages() {
        return Helper.copyAndSortModifiable(this.languages, new EntityComparators.OrderComparator<>());
    }

    public void setLanguages(List<GameModelLanguage> languages) {
        this.languages = languages;
        int i = 0;
        for (GameModelLanguage lang : this.languages) {
            lang.setIndexOrder(i++);
            lang.setGameModel(this);
        }
    }

    /**
     * Find a language of the gameModel which match the given name
     *
     * @param code language code to find
     *
     * @return the language with matching code or null
     *
     */
    public GameModelLanguage getLanguageByCode(String code) {
        if (code != null) {
            String CODE = code.toUpperCase();
            for (GameModelLanguage lang : this.getRawLanguages()) {
                if (CODE.equals(lang.getCode())) {
                    return lang;
                }
            }
        }
        return null;
    }

    /**
     * Find a language of the gameModel which match the given name
     *
     * @param code language code to find
     *
     * @return the language with matching code or null
     *
     */
    public GameModelLanguage getLanguageByRefId(String refId) {
        if (refId != null) {
            for (GameModelLanguage lang : this.getRawLanguages()) {
                if (refId.equals(lang.getRefId())) {
                    return lang;
                }
            }
        }
        return null;
    }

    /**
     * Find a language of the gameModel which match the given name
     *
     * @param name language display name to find
     *
     * @return the language with matching lang or null
     */
    public GameModelLanguage getLanguageByName(String name) {
        if (name != null) {
            String theName = name.toLowerCase();
            for (GameModelLanguage lang : this.getRawLanguages()) {
                if (theName.equals(lang.getLang().toLowerCase())) {
                    return lang;
                }
            }
        }
        return null;
    }

    /**
     * get list of language code, sorted according to player preferences if such a player is provided;
     *
     * @param player may be null
     *
     * @return list
     */
    public List<String> getPreferredLanguagesCodes(Player player) {
        List<GameModelLanguage> sortedLanguages = getLanguages();
        ArrayList<String> langs = new ArrayList<>(sortedLanguages.size());

        for (GameModelLanguage gml : sortedLanguages) {
            if (player != null && gml.getCode().equals(player.getLang())) {
                langs.add(0, gml.getCode());
            } else {
                langs.add(gml.getCode());
            }
        }

        return langs;
    }

    /**
     * get list of language code, the given one first
     *
     *
     * @param preferredCode preferred code, may be null or empty
     *
     * @return list
     */
    public List<String> getPreferredLanguagesCode(String preferredCode) {
        List<GameModelLanguage> sortedLanguages = getLanguages();
        ArrayList<String> langs = new ArrayList<>(sortedLanguages.size());

        for (GameModelLanguage gml : sortedLanguages) {
            if (gml.getCode().equals(preferredCode.toUpperCase())) {
                langs.add(0, gml.getCode());
            } else {
                langs.add(gml.getCode());
            }
        }

        return langs;
    }

    /**
     * @return the template
     */
    public Boolean getTemplate() {
        return type == GmType.MODEL || type == GmType.SCENARIO;
    }

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
        return Helper.GAMEMODEL_CHANNEL_PREFIX + getId();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return WegasPermission.getAsCollection(this.getAssociatedWritePermission());
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return WegasPermission.getAsCollection(this.getAssociatedReadPermission());
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return this.isProtected();
    }

    /**
     * Is this scenario protected ?
     * A scenario is protected if it depends on a model (but the protection is disabled if the instances propagation
     * is ongoing)
     *
     * @return
     */
    public boolean isProtected() {
        // only scenarios which are based on a model are protected
        // but do no protect a gameModel when the propagation process is ongoing
        return (this.isScenario() && this.getBasedOnId() != null && !this.onGoingPropagation);
    }

    /**
     * Inform the game model the propagation process in ongoing
     *
     * @param onGoingPropagation
     */
    public void setOnGoingPropagation(Boolean onGoingPropagation) {
        this.onGoingPropagation = onGoingPropagation;
    }

    @JsonIgnore
    public boolean isModel() {
        return this.getType().equals(GmType.MODEL);
    }

    @JsonIgnore
    public boolean isScenario() {
        return this.getType().equals(GmType.SCENARIO);
    }

    @JsonIgnore
    public boolean isReference() {
        return this.getType().equals(GmType.REFERENCE);
    }

    @JsonIgnore
    public boolean isPlay() {
        return this.getType().equals(GmType.PLAY);
    }

    @Override
    public WithPermission getMergeableParent() {
        return null;
    }

    @JsonIgnore
    public boolean isScenarioBasedOnModel() {
        return this.isScenario() && this.getBasedOn() != null;
    }

    @Override
    public Visibility getInheritedVisibility() {
        return Visibility.INHERITED;
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        if (this.isPlay()) {
            return WegasMembership.TRAINER;
        } else {
            return WegasMembership.SCENARIST;
        }
    }

    @Override
    public WegasPermission getAssociatedReadPermission() {
        return GameModel.getAssociatedReadPermission(this.getId());
    }

    public static WegasPermission getAssociatedReadPermission(long id) {
        return new WegasEntityPermission(id, WegasEntityPermission.Level.READ, WegasEntityPermission.EntityType.GAMEMODEL);
    }

    @Override
    public WegasPermission getAssociatedWritePermission() {
        return GameModel.getAssociatedWritePermission(this.getId());
    }

    public static WegasPermission getAssociatedWritePermission(long id) {
        return new WegasEntityPermission(id, WegasEntityPermission.Level.WRITE, WegasEntityPermission.EntityType.GAMEMODEL);
    }

    /**
     * The permission which is required to translate a specific language within the game model
     *
     * @param lang the language to translate. no languages means "the permission to translate at least one language no matter which one"
     *
     * @return
     */
    public WegasPermission getAssociatedTranslatePermission(String lang) {
        return new WegasEntityPermission(this.getId(), WegasEntityPermission.Level.TRANSLATE, WegasEntityPermission.EntityType.GAMEMODEL, lang);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        Map<String, List<AbstractEntity>> map = new HashMap<>();
        ArrayList<AbstractEntity> entities = new ArrayList<>();
        entities.add(this);
        map.put(this.getChannel(), entities);
        return map;
    }

    public enum GmType {
        /**
         * A model
         */
        MODEL,
        /**
         * Model reference
         */
        REFERENCE,
        /**
         * Model implementation
         */
        SCENARIO,
        /**
         * Private COPY for games
         */
        PLAY
    }

    @Override
    public void inject(JCRConnectorProvider jcrProvider) {
        this.jcrProvider = jcrProvider;
    }

    @JsonIgnore
    public ContentConnector getConnector(ContentConnector.WorkspaceType wType) throws RepositoryException {
        if (jcrProvider != null) {
            return jcrProvider.getContentConnector(this, wType);
        }
        return null;
    }

    /**
     * <ul>
     * <li>LIVE: {@link Status#LIVE}</li>
     * <li>BIN: {@link Status#BIN}</li>
     * <li>DELETE: {@link Status#DELETE}</li>
     * <li>SUPPRESSED: {@link Status#SUPPRESSED}</li>
     * </ul>
     */
    public enum Status {
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
    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", " + this.getType() + ", " + getName() + ")";
    }
}
