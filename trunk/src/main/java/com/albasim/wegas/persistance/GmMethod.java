/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.albasim.wegas.persistance;

import com.albasim.wegas.conf.Conf;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.helper.AlbaHelper;
import java.io.Serializable;
import java.util.List;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
// Method name is unique within the type !
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"belongsto_id", "name"}))
@XmlType(name = "Method", propOrder = {"id", "name", "returnType", "parameters", "body"})
public class GmMethod extends NamedAlbaEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator="method_seq")
    private Long id;

    @NotNull
    @Pattern(regexp="\\w+$")
    private String name;


    @XmlTransient
    @ManyToOne
    @NotNull
    private GmType belongsTo; // Type the method belongs to


    private String returnType; // A GameModel TypeName or a primitive one (such as int, double or String)


    private String body;


    @OneToMany(mappedBy = "method", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    @XmlTransient // do not serialize parameter within the method
    private List<GmParameter> parameters;


    @Override
    public Long getId() {
        return id;
    }


    @Override
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

    

    public String getBody() {
        return body;
    }


    public void setBody(String body) {
        this.body = body;
    }


    @XmlTransient
    public GmType getBelongsTo() {
        return belongsTo;
    }


    public void setBelongsTo(GmType belongsTo) {
        this.belongsTo = belongsTo;
    }


    public String getReturnType() {
        return returnType;
    }


    public void setReturnType(String returnType) {
        // TODO Validate the type !

        this.returnType = returnType;
    }


    @XmlTransient
    // Same here: avoid serializing param here
    public List<GmParameter> getParameters() {
        return this.parameters;
    }


    public void addParameter(GmParameter p) {
        parameters.add(p);
    }


    public void setParameters(List<GmParameter> parameters) {
        this.parameters = parameters;
    }

    @PreUpdate
    void preUpdate(){
        validate();
    }


    public void validate() {
        GameModel gameModel = this.getBelongsTo().getGameModel();
        GmType lookupType = gameModel.lookupType(returnType, null);
        if (lookupType != null){
            return;
        } else if (AlbaHelper.isTypeNameValid(returnType)) {
            return;
        }

        throw new InvalidContent("Method return type is not valid. Please use a type of the game model or one of " + Conf.privitiveTypes);
    }
 

    @Override
    @XmlTransient
    public GmType getParent() {
        return belongsTo;
    }
}
