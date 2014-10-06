/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.primitive.BooleanDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.SingleResultChoiceDescriptor;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.map.annotate.JsonView;
import org.eclipse.persistence.annotations.JoinFetch;

/**
 *
 * @param <T>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
//@EntityListeners({GmVariableDescriptorListener.class})
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = {"gamemodel_gamemodelid", "name"}) // Name has to be unique for the whole game model
// @UniqueConstraint(columnNames = {"variabledescriptor_id", "name"})           // Name has to be unique within a list
// @UniqueConstraint(columnNames = {"rootgamemodel_id", "name"})                // Names have to be unique at the base of a game model (root elements)
})
@NamedQuery(name = "findVariableDescriptorsByRootGameModelId", query = "SELECT DISTINCT vd FROM VariableDescriptor vd LEFT JOIN vd.gameModel AS gm WHERE gm.id = :gameModelId")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "ListDescriptor", value = ListDescriptor.class),
    @JsonSubTypes.Type(name = "StringDescriptor", value = StringDescriptor.class),
    @JsonSubTypes.Type(name = "TextDescriptor", value = TextDescriptor.class),
    @JsonSubTypes.Type(name = "BooleanDescriptor", value = BooleanDescriptor.class),
    @JsonSubTypes.Type(name = "NumberDescriptor", value = NumberDescriptor.class),
    @JsonSubTypes.Type(name = "InboxDescriptor", value = InboxDescriptor.class),
    @JsonSubTypes.Type(name = "FSMDescriptor", value = StateMachineDescriptor.class),
    @JsonSubTypes.Type(name = "ResourceDescriptor", value = ResourceDescriptor.class),
    @JsonSubTypes.Type(name = "TaskDescriptor", value = TaskDescriptor.class),
    @JsonSubTypes.Type(name = "QuestionDescriptor", value = QuestionDescriptor.class),
    @JsonSubTypes.Type(name = "ChoiceDescriptor", value = ChoiceDescriptor.class),
    @JsonSubTypes.Type(name = "SingleResultChoiceDescriptor", value = SingleResultChoiceDescriptor.class),
    @JsonSubTypes.Type(name = "ObjectDescriptor", value = ObjectDescriptor.class)})
abstract public class VariableDescriptor<T extends VariableInstance> extends NamedEntity implements Searchable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    @JsonView(value = Views.EditorI.class)
    @Column(name = "Descriptor_comments")
    private String comments;
    /**
     * Here we cannot use type T, otherwise jpa won't handle the db ref
     * correctly
     */
    @OneToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, optional = false)
    @JsonView(value = Views.EditorExtendedI.class)
    private VariableInstance defaultInstance;
    /**
     *
     */
    //@JsonBackReference
    @ManyToOne
    @JoinColumn
    private GameModel gameModel;
    /**
     *
     */
    @Id
    @Column(name = "variabledescriptor_id")
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     *
     */
    //@JsonView(Views.EditorI.class)
    private String label;
    /*
     * @OneToOne(cascade = CascadeType.ALL) @NotNull @JoinColumn(name
     * ="SCOPE_ID", unique = true, nullable = false, insertable = true,
     * updatable = true)
     */
    //@BatchFetch(BatchFetchType.JOIN)
    //@JsonManagedReference
    @OneToOne(cascade = {CascadeType.ALL}, orphanRemoval = true, optional = false)
    @JoinFetch
    @JsonView(value = Views.WithScopeI.class)
    private AbstractScope scope;
    /**
     * Title displayed in the for the player, should be removed from variable
     * descriptor and placed in the required entities (MCQQuestionDrescriptor,
     * TriggerDescriptor, aso)
     */
    @Column(name = "editorLabel")
    private String title;
    /**
     *
     */
    //@JsonView(Views.EditorExtendedI.class)
    @NotNull
    @Basic(optional = false)
    protected String name;

    /**
     *
     */
    //@ManyToMany(cascade = {CascadeType.MERGE, CascadeType.PERSIST, CascadeType.REFRESH})
    //@JoinTable(joinColumns = {
    //    @JoinColumn(referencedColumnName = "variabledescriptor_id")},
    //        inverseJoinColumns = {
    //    @JoinColumn(referencedColumnName = "tag_id")})
    //@XmlTransient
    //private List<Tag> tags;
    /**
     *
     */
    public VariableDescriptor() {
    }

    /**
     *
     * @param name
     */
    public VariableDescriptor(String name) {
        this.name = name;
    }

    /**
     *
     * @param name
     * @param defaultInstance
     */
    public VariableDescriptor(String name, T defaultInstance) {
        this.name = name;
        this.defaultInstance = defaultInstance;
    }

    /**
     *
     * @param defaultInstance
     */
    public VariableDescriptor(T defaultInstance) {
        this.defaultInstance = defaultInstance;
    }

    /**
     *
     * @return
     */
    public String getComments() {
        return comments;
    }

    /**
     *
     * @param comments
     */
    public void setComments(String comments) {
        this.comments = comments;
    }

    /**
     * @return the defaultInstance
     */
    public T getDefaultInstance() {
        return (T) defaultInstance;
    }

    /**
     * @param defaultInstance the defaultValue to set
     */
    public void setDefaultInstance(T defaultInstance) {
        this.defaultInstance = defaultInstance;
    }

    /**
     *
     * @return
     */
    @XmlTransient
    public GameModel getGameModel() {
        return this.gameModel;
    }

    /**
     *
     * @param gameModel
     */
    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    /**
     *
     * @return
     */
    @XmlTransient
    public int getGameModelId() {
        return this.gameModel.getId().intValue();
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
     * @param player
     * @return
     */
    public T getInstance(Player player) {
        return (T) this.scope.getVariableInstance(player);
    }

    /**
     *
     * @return
     */
    @XmlTransient
    public T getInstance() {
        return (T) this.getScope().getInstance();
    }

    /**
     *
     * @param defaultInstance
     * @param player
     * @return
     */
    @XmlTransient
    public T getInstance(Boolean defaultInstance, Player player) {
        if (defaultInstance) {
            return this.getDefaultInstance();
        } else {
            return this.getInstance(player);
        }
    }

    /**
     * @return the label
     */
    public String getLabel() {
        return label;
    }

    /**
     * @param label the label to set
     */
    public void setLabel(String label) {
        this.label = label;
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
     * @return the scope
     */
    public AbstractScope getScope() {
        return scope;
    }

    /**
     * @param scope the scope to set
     * @fixme here we cannot use managed references since this.class is
     * abstract.
     */
    //@JsonManagedReference
    public void setScope(AbstractScope scope) {
        this.scope = scope;
        scope.setVariableDescscriptor(this);
    }

    /**
     *
     * @return title
     */
    public String getTitle() {
        return title;
    }

    /**
     *
     * @param title
     */
    public void setTitle(String title) {
        this.title = title;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        VariableDescriptor other = (VariableDescriptor) a;
        this.setName(other.getName());
        this.setLabel(other.getLabel());
        this.setTitle(other.getTitle());
        this.setComments(other.getComments());
        this.defaultInstance.merge(other.getDefaultInstance());
        if (other.getScope() != null) {
            this.scope.setBroadcastScope(other.getScope().getBroadcastScope());
        }
        //this.scope.merge(vd.getScope());
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        if (this.getScope() == null) {
            this.setScope(new TeamScope());
        }
    }

    /**
     *
     * @param force
     */
    public void propagateDefaultInstance(boolean force) {
        this.getScope().propagateDefaultInstance(force);
    }

    @Override
    public Boolean contains(String criteria) {
        return Helper.insensitiveContains(this.getName() + this.getTitle() + this.getComments(), criteria);
    }

    /**
     *
     * @return
     */
    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", " + this.getName() + ")";
    }
}
