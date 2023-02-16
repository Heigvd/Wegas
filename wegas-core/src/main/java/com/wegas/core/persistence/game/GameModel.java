/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.INTERNAL;
import ch.albasim.wegas.annotations.ProtectionLevel;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.JsonNode;
import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.jcr.content.ContentConnector;
import com.wegas.core.jcr.jta.JCRClient;
import com.wegas.core.jcr.jta.JCRConnectorProvider;
import com.wegas.core.jcr.page.Page;
import com.wegas.core.jcr.page.Pages;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.AcceptInjection;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
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
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.NumberView;
import com.wegas.editor.view.StringView;
import com.wegas.editor.view.Textarea;
import java.util.*;
import java.util.Map.Entry;
import java.util.stream.Collectors;
import javax.jcr.RepositoryException;
import javax.persistence.Basic;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQuery;
import javax.persistence.OneToMany;
import javax.persistence.PostPersist;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;
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
    name = "GameModel.findByTypesAndStatuses",
    query = "SELECT a FROM GameModel a WHERE a.status IN :statuses AND a.type in :types ORDER BY a.name ASC"
)
@NamedQuery(
    name = "GameModel.findIdsByGameId",
    query = "SELECT g.gameModel.id FROM Game g WHERE g.id IN :gameIds"
)
@NamedQuery(
    name = "GameModel.findDistinctLogIds",
    query = "SELECT DISTINCT(gm.properties.logID) FROM GameModel gm WHERE gm.properties.logID IS NOT NULL AND gm.properties.logID != ''"
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
@NamedQuery(
    name = "GameModel.findReference",
    query = "SELECT gm FROM GameModel gm where gm.basedOn.id = :id AND gm.type =  com.wegas.core.persistence.game.GameModel.GmType.REFERENCE"
)
@Table(
    indexes = {
        @Index(columnList = "createdby_id"),
        @Index(columnList = "basedon_id")
    }
)
public class GameModel extends AbstractEntity implements DescriptorListI<VariableDescriptor>, AcceptInjection, InstanceOwner, Broadcastable, NamedEntity, JCRClient {

    private static final Logger logger = LoggerFactory.getLogger(GameModel.class);

    private static final long serialVersionUID = 1L;

    @Transient
    private Boolean onGoingPropagation = false;

    @JsonIgnore
    @Transient
    protected Beanjection beans;

    @Transient
    @JsonIgnore
    private JCRConnectorProvider jcrProvider;

    /**
     *
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @JsonView({Views.IndexI.class, Views.LobbyI.class})
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
    private Integer uiversion;

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
    @JsonView({Views.ExtendedI.class, Views.LobbyI.class})
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
    @JsonView({Views.ExtendedI.class, Views.LobbyI.class})
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
     * A list of Variable Descriptors that are at the root level of the hierarchy (other
     * VariableDescriptor can be placed inside of a ListDescriptor's items List).
     */
    @OneToMany(mappedBy = "root", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    //@OrderColumn(name = "gm_items_order")
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
     * Holds all the scripts and others libraries contained in current game model.
     */
    @OneToMany(mappedBy = "gameModel", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonView({Views.ExportI.class})
    @WegasEntityProperty(includeByDefault = false, notSerialized = true)
    private List<GameModelContent> libraries = new ArrayList<>();

    /**
     *
     */
    @Embedded
    @WegasEntityProperty(optional = false, nullable = false, proposal = GmProperties.class)
    private GameModelProperties properties = new GameModelProperties();

    /**
     * Holds a reference to the pages, used to serialize page and game model at the same time.
     */
    @Transient
    @WegasEntityProperty(includeByDefault = false, protectionLevel = ProtectionLevel.ALL, notSerialized = true)
    @JsonView({Views.ExportI.class})
    private Map<String, JsonNode> pages;

    /**
     *
     */
    public GameModel() {
        // ensure there is a default constructor
    }

    /**
     * @param name
     */
    public GameModel(String name) {
        this.name = name;
    }

//    /**
//     * @param pageMap
//     *
//     * @throws RepositoryException
//     */
//    @JsonCreator
//    public GameModel(@JsonProperty("pages") JsonNode pageMap) throws RepositoryException {
//        Map<String, JsonNode> map = new HashMap<>();
//        if (pageMap == null) {
//            return;
//        }
//        String curKey;
//        Iterator<String> iterator = pageMap.fieldNames();
//        while (iterator.hasNext()) {
//            curKey = iterator.next();
//            map.put(curKey, pageMap.get(curKey));
//        }
//        this.setPages(map);
//    }
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

    @Override
    public void setBeanjection(Beanjection beanjection) {
        this.beans = beanjection;
    }

    /**
     * Register new descriptor within the main descriptor list Method do nothing id descriptor is
     * already registered
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
     * Make sure all variableDescriptors in the gameModel are registered in the gamemodel
     * variableDescriptors list
     */
    public void propagateGameModel() {
        //this.variableDescriptors.clear();
        this.propagateGameModel(this);
    }

    /**
     * Make sur all descriptor (in the given list, deep) a registered within the main descriptor
     * list
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
        if (this.getUiversion() == null) {
            this.setUiversion(1);
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

    public Integer getUiversion() {
        return uiversion;
    }

    public void setUiversion(Integer uiversion) {
        this.uiversion = uiversion;
    }

    /**
     * @return Current GameModel's status
     */
    @WegasExtraProperty(
        optional = false, nullable = false,
        view = @View(
            label = "Status",
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
     * @return a list of Variable Descriptors that are at the root level of the hierarchy (other
     *         VariableDescriptor can be placed inside of a ListDescriptor's items List)
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

    /**
     * @return all teams from all games
     */
    @JsonIgnore
    public List<Team> getTeams() {
        List<Team> teams = new ArrayList<>();
        for (Game g : this.getGames()) {
            teams.addAll(g.getTeams());
        }
        return teams;
    }

    /**
     * {@inheritDoc }
     */
    @JsonIgnore
    @Override
    public Player getUserLivePlayer(User user) {
        for (Game g : this.getGames()) {
            Player theP = g.getUserLivePlayer(user);
            if (theP != null) {
                return theP;
            }
        }
        return null;
    }

    /**
     * {@inheritDoc }
     */
    @JsonIgnore
    @Override
    public Player getUserLiveOrSurveyPlayer(User user) {
        for (Game g : this.getGames()) {
            Player theP = g.getUserLiveOrSurveyPlayer(user);
            if (theP != null) {
                return theP;
            }
        }
        return null;
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
     * Return a test player. It may be a player in any team of a DebugGame or a player in a
     * DebugTeam
     *
     * @return testPlayer
     */
    @JsonIgnore
    @Override
    public Player getTestPlayer() {
        for (Game game : this.getGames()) {
            Player testPlayer = game.getTestPlayer();
            if (testPlayer != null) {
                return testPlayer;
            }
        }
        return null;
    }

    /**
     * @return the createdTime
     */
    @WegasExtraProperty(nullable = false, optional = false)
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
     * get the list of all libraries. Unsorted. all library types
     *
     * @return the list of all libraries
     */
    public List<GameModelContent> getLibraries() {
        return libraries;
    }

    /**
     * Set gameModel libraries
     *
     * @param libraries
     */
    public void setLibraries(List<GameModelContent> libraries) {
        this.libraries = libraries;
        if (libraries != null) {
            libraries.forEach(g -> g.setGameModel(this));
        }
    }

    /**
     * Get all libraries. Groupes by type and mapped by key
     *
     * @return
     */
    @JsonIgnore
    public Map<String, Map<String, GameModelContent>> getLibrariesAsMap() {
        Map<String, Map<String, GameModelContent>> libraries = new HashMap<>();
        for (GameModelContent gmc : this.getLibraries()) {
            if (!libraries.containsKey(gmc.getLibraryType())) {
                libraries.put(gmc.getLibraryType(), new HashMap<>());
            }
            libraries.get(gmc.getLibraryType()).put(gmc.getContentKey(), gmc);
        }
        return libraries;
    }

    /**
     * Set library from map
     *
     * @param libraries
     *
     */
    @JsonIgnore
    public void setLibrariesFromMap(Map<String, Map<String, GameModelContent>> libraries) {
        List<GameModelContent> newLibs = new ArrayList<>();
        libraries
            .forEach((kLib, vLib) -> {
                vLib.forEach((kEntry, vEntry) -> {
                    vEntry.setLibraryType(kLib);
                    vEntry.setContentKey(kEntry);
                    newLibs.add(vEntry);
                });
            });
        this.setLibraries(newLibs);
    }

    /**
     * Return libraries of the given type
     *
     * @param libraryType type of library to fetch
     *
     * @return list of all libraries of the given type
     */
    @JsonIgnore
    public List<GameModelContent> getLibrariesAsList(String libraryType) {
        return this.libraries.stream()
            .filter(g -> g.getLibraryType().equals(libraryType))
            .collect(Collectors.toList());
    }

    /**
     * Return libraries of the given type, mapped by there key name
     *
     * @param libraryType type of library to fetch
     *
     * @return map of all libraries of the given type
     */
    @JsonIgnore
    public Map<String, GameModelContent> getLibrariesAsMap(String libraryType) {
        return this.libraries.stream()
            .filter(g -> g.getLibraryType().equals(libraryType))
            .collect(Collectors.toMap(g -> g.getContentKey(), g -> g));
    }

    /**
     * Find the library of given type with given key.
     *
     * @param libraryName type of library to look for
     * @param key         library key name
     *
     * @return the found one or null
     */
    public GameModelContent findLibrary(String libraryName, String key) {
        for (GameModelContent item : this.libraries) {
            if (item.getContentKey().equals(key)
                && item.getLibraryType().equals(libraryName)) {
                return item;
            }
        }
        return null;
    }

    /**
     * Add all provided gameModelContent libraries in the gameModel. Overides libraries' type with
     * given one. Overrides libraries keys with keys from the map
     *
     * @param libraries content to add
     * @param type      type of libraries
     * @param mimetype  MIME type of libraries
     */
    private void addAllToLibraries(Map<String, GameModelContent> libraries, String type, String mimeType) {
        libraries.forEach((key, gmc) -> {
            gmc.setLibraryType(type);
            gmc.setContentKey(key);
            gmc.setContentType(mimeType);
            this.addLibrary(gmc);
        });
    }

    /**
     * Backward compatibility for old exported JSON
     *
     * @param library
     */
    public void setCssLibrary(Map<String, GameModelContent> libraries) {
        this.addAllToLibraries(libraries, GameModelContent.CSS, "test/css");
    }

    /**
     * Backward compatibility for old exported JSON
     *
     * @param library
     */
    public void setScriptLibrary(Map<String, GameModelContent> libraries) {
        this.addAllToLibraries(libraries, GameModelContent.SERVER_SCRIPT, "application/javascript");
    }

    /**
     * Backward compatibility for old exported JSON
     *
     * @param libraries new client scripts
     */
    public void setClientScriptLibrary(Map<String, GameModelContent> libraries) {
        this.addAllToLibraries(libraries, GameModelContent.CLIENT_SCRIPT, "application/javascript");
    }

    /**
     * Add the given GameModelContent to libraries.
     *
     * @param gameModelContent
     */
    public void addLibrary(GameModelContent gameModelContent) {
        if (!this.libraries.contains(gameModelContent)) {
            this.libraries.add(gameModelContent);
            gameModelContent.setGameModel(this);
        }
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
        return Helper.copyAndSortModifiable(this.items, new EntityComparators.OrderComparator<>());
    }

    @JsonIgnore
    @Override
    public List<VariableDescriptor> getRawItems() {
        return items;
    }

    @Override
    @JsonIgnore
    public List<VariableDescriptor> getReadableItems() {
        if (this.beans.getRequestManager().isEditorView()) {
            return this.getItems();
        } else {
            return this.beans.getVariableDescriptorFacade().getReadableChildren(this);
        }
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

//        this.items = new ArrayList<>();
//        for (VariableDescriptor vd : items) {
//            this.addItem(vd);
//        }
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
                pagesDAO.delete(); // Remove existing pages
                // Pay Attention: this.pages != this.getPages() !
                //  -> this.pages contains deserialized pages
                //  -> getPages() fetchs them from the jackrabbit repository
                for (Entry<String, JsonNode> p : this.pages.entrySet()) { // Add all pages
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
     * @return name of the user who created this or null if user no longer exists
     */
    @JsonView({Views.EditorI.class, Views.LobbyI.class})
    public String getCreatedByName() {
        if (this.getCreatedBy() != null) {
            return this.getCreatedBy().getName();
        }
        return null;
    }

    /**
     * @return name of the user who created this or null if user no longer exists
     */
    @WegasExtraProperty
    //@JsonView({Views.EditorI.class, Views.LobbyI.class})
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public Long getCreatedById() {
        if (this.getCreatedBy() != null) {
            return this.getCreatedBy().getId();
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
        optional = false, nullable = false,
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
            String upperCode = code.toUpperCase();
            for (GameModelLanguage lang : this.getRawLanguages()) {
                if (upperCode.equals(lang.getCode())) {
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
     * get list of language code, sorted according to player preferences if such a player is
     * provided;
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
     * Find any debug game in the gameModel
     *
     * @return the debugGame if found, null otherwise
     */
    @JsonIgnore
    public DebugGame findDebugGame() {
        for (Game g : getGames()) {
            if (g instanceof DebugGame) {
                return (DebugGame) g;
            }
        }
        return null;
    }

    /**
     * TODO: select game.* FROM GAME where dtype like 'DEBUGGAME' and gamemodelid = this.getId()
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

    @JsonIgnore
    public String getEditorChannel() {
        return Helper.GAMEMODEL_EDITOR_CHANNEL_PREFIX + getId();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return WegasPermission.getAsCollection(this.getAssociatedWritePermission());
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return WegasPermission.getAsCollection(this.getAssociatedReadPermission());
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return this.isProtected();
    }

    /**
     * Is this scenario protected ? A scenario is protected if it depends on a model (but the
     * protection is disabled if the instances propagation is ongoing)
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
        return this.isScenario() && this.getBasedOnId() != null;
    }

    @Override
    public Visibility getInheritedVisibility() {
        return Visibility.INHERITED;
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission(RequestContext context) {
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
     * @param lang the language to translate. no languages means "the permission to translate at
     *             least one language no matter which one"
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
        ArrayList<AbstractEntity> entities = new ArrayList<>();
        entities.add(this);

        // Fetch all user who with any access to the gameModel
        Set<User> users = new HashSet<>();

        // all scenarists
        users.addAll(beans.getGameModelFacade().findScenarists(this.getId()));

        // all trainers
        games.forEach(game -> {
            users.addAll(beans.getGameFacade().findTrainers(game.getId()));
        });

        // all players
        this.getPlayers().stream().forEach(p -> {
            if (p.getUser() != null) {
                users.add(p.getUser());
            }
        });

        // Send update through each user channel
        Map<String, List<AbstractEntity>> map = new HashMap<>();
        users.forEach(user -> {
            map.put(user.getChannel(), entities);
        });

        // send it to admins too
        map.put(WebsocketFacade.ADMIN_LOBBY_CHANNEL, entities);

        // and eventually to the game model chanel
        map.put(this.getChannel(), entities);
        return map;
    }

    public void removeLib(GameModelContent gameModelContent) {
        this.libraries.remove(gameModelContent);
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
         * Does not exist anymore. Actually, this status should never persist. Used internally as
         * game's missing.
         */
        SUPPRESSED
    }

//     /*try transient anotation on field "pages". Problem with anotation mixin'*/
//     private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
//       in.defaultReadObject();
//       this.pages = new HashMap<>();
//     }
    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", " + this.getType() + ", " + getName() + ")";
    }
}
