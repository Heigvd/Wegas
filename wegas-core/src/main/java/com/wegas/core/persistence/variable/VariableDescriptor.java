/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.leaderway.persistence.ResourceDescriptor;
import com.wegas.leaderway.persistence.TaskDescriptor;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.SingleResultChoiceDescriptor;
import com.wegas.messaging.persistence.InboxDescriptor;
import java.util.List;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @param <T>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
//@EntityListeners({GmVariableDescriptorListener.class})
@Table(uniqueConstraints = {
    //    @UniqueConstraint(columnNames = {"gamemodel_id", "name"})             // Name has to be unique for the whole game model
    @UniqueConstraint(columnNames = {"rootgamemodel_id", "name"}) // Names have to be unique at the base of a game model (root elements)
//    @UniqueConstraint(columnNames = {"variabledescriptor_id", "name"})        // Names have to be unique within a list
})
@NamedQuery(name = "findVariableDescriptorsByRootGameModelId", query = "SELECT DISTINCT variableDescriptor FROM VariableDescriptor variableDescriptor LEFT JOIN variableDescriptor.gameModel AS gm WHERE gm.id = :gameModelId")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "StringDescriptor", value = StringDescriptor.class),
    @JsonSubTypes.Type(name = "ListDescriptor", value = ListDescriptor.class),
    @JsonSubTypes.Type(name = "MCQDescriptor", value = QuestionDescriptor.class),
    @JsonSubTypes.Type(name = "NumberDescriptor", value = NumberDescriptor.class),
    @JsonSubTypes.Type(name = "InboxDescriptor", value = InboxDescriptor.class),
    @JsonSubTypes.Type(name = "FSMDescriptor", value = StateMachineDescriptor.class),
    @JsonSubTypes.Type(name = "ChoiceDescriptor", value = ChoiceDescriptor.class),
    @JsonSubTypes.Type(name = "ResourceDescriptor", value = ResourceDescriptor.class),
    @JsonSubTypes.Type(name = "TaskDescriptor", value = TaskDescriptor.class),
    @JsonSubTypes.Type(name = "SingleResultChoiceDescriptor", value = SingleResultChoiceDescriptor.class)
})
abstract public class VariableDescriptor<T extends VariableInstance> extends NamedEntity {

    private static final long serialVersionUID = 1L;
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
    @NotNull
    protected String name;
    /**
     *
     */
    private String editorLabel;
    /**
     *
     */
    private String label;
    /**
     *
     */
    @ManyToOne
    @JoinColumn
    //@JsonBackReference
    private GameModel gameModel;
    /**
     * Here we cannot use type T, otherwise jpa won't handle the db ref
     * correctly
     */
    @OneToOne(cascade = {CascadeType.ALL})
    @NotNull
    private VariableInstance defaultInstance;
    /*
     * @OneToOne(cascade = CascadeType.ALL) @NotNull @JoinColumn(name
     * ="SCOPE_ID", unique = true, nullable = false, insertable = true,
     * updatable = true)
     */
    @OneToOne(cascade = {CascadeType.ALL}, orphanRemoval = true)
    @NotNull
    //@JsonManagedReference
    private AbstractScope scope;
    /**
     *
     */
    @ManyToMany(cascade = {CascadeType.MERGE, CascadeType.PERSIST, CascadeType.REFRESH})
    @JoinTable(joinColumns = {
        @JoinColumn(referencedColumnName = "variabledescriptor_id")},
    inverseJoinColumns = {
        @JoinColumn(referencedColumnName = "tag_id")})
    private List<Tag> tags;

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
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        VariableDescriptor other = (VariableDescriptor) a;
        this.setLabel(other.getLabel());
        this.setEditorLabel(other.getEditorLabel());
        this.defaultInstance.merge(other.getDefaultInstance());
        //this.scope.merge(vd.getScope());
    }

    /**
     *
     * @param force
     */
    public void propagateDefaultInstance(boolean force) {
        this.getScope().propagateDefaultInstance(force);
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
     * @return
     */
    @Override
    public Long getId() {
        return id;
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
     * @return editorLabel
     */
    public String getEditorLabel() {
        return editorLabel;
    }

    /**
     *
     * @param editorLabel
     */
    public void setEditorLabel(String editorLabel) {
        this.editorLabel = editorLabel;
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
    public GameModel getGameModel() {
        return this.gameModel;
    }

    /**
     * @return the scope
     */
    public AbstractScope getScope() {
        return scope;
    }

    /**
     * @param scope the scope to set @fixme here we cannot use managed
     * references since this.class is abstract.
     */
    //@JsonManagedReference
    public void setScope(AbstractScope scope) {
        this.scope = scope;
        scope.setVariableDescscriptor(this);
    }

    /**
     * @return the defaultInstance
     */
    public VariableInstance getDefaultInstance() {
        return defaultInstance;
    }

    /**
     * @param defaultInstance the defaultValue to set
     */
    public void setDefaultInstance(T defaultInstance) {
        this.defaultInstance = defaultInstance;
    }

    /**
     * @return the tags
     */
    public List<Tag> getTags() {
        return tags;
    }

    /**
     * @param tags the tags to set
     */
    public void setTags(List<Tag> tags) {
        this.tags = tags;
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
     */
    @PrePersist
    @PreUpdate
    public void prePersist() {
        if ((this.editorLabel == null || !this.editorLabel.isEmpty()) && this.label != null) {
            this.editorLabel = this.label;
        }
    }
}
