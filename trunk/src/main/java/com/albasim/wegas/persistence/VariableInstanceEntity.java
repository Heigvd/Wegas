/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.persistence;

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistence.instance.GmComplexInstance;
import com.albasim.wegas.persistence.instance.GmIntegerInstance;
import com.albasim.wegas.persistence.scope.ScopeEntity;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {}))

@XmlType(name = "VariableInstance", propOrder = {"@class", "id", "name", "type"})
public class VariableInstanceEntity extends NamedEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = Logger.getLogger("GMVariableKInstance");


    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "var_instance_seq")
    private Long id;
    
    @ManyToOne
    @XmlTransient
    private ScopeEntity scope;

/*
    @ManyToOne
    @NotNull
    @XmlTransient
    private VariableDescriptorEntity descriptor;


    @OneToMany(mappedBy = "variable", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    @XmlTransient
    private List<GmInstance> instances;

    // The node this var belongs to

    @ManyToOne
    @XmlTransient
    private GameModel parentGameModel;


    @ManyToOne
    @XmlTransient
    private GmComplexInstance parentComplexInstance;*/

  /*
    @Transient
    @XmlTransient
    private String stringName;

    // To link the variable to the int instance specified through the 
    // EqualCardinality

  @XmlTransient
    @ManyToOne
    private GmIntegerInstance integerInstance;*/


    @Override
    @XmlTransient
    public AnonymousEntity getParent() {
        throw new InvalidContent("Orphan!");
    }

    @Override
    public String getName() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void setName(String name) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public Long getId() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void setId(Long id) {
        throw new UnsupportedOperationException("Not supported yet.");
    }



}