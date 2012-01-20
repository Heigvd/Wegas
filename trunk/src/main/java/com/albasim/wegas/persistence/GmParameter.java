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

import com.albasim.wegas.conf.Conf;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.helper.AlbaHelper;
import java.io.Serializable;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
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
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"method_id", "name"}))
@XmlType(name = "Parameter")
public class GmParameter extends NamedEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "parameter_seq")
    private Long id;


    @NotNull
    @Pattern(regexp = "^\\w+$")
    private String name;

    // TODO Validate !

    private String type; // One of the GameModel Types or a primitive one


    @XmlTransient
    @ManyToOne
    @NotNull
    private GmMethod method;


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


    public String getType() {
        return type;
    }


    public void setType(String type) {
        this.type = type;
    }


    public void setMethod(GmMethod m) {
        this.method = m;
    }


    @XmlTransient
    public GmMethod getMethod() {
        return method;
    }

    public void validate(){
        GameModel gameModel = this.getMethod().getBelongsTo().getGameModel();
        GmType lookupType = gameModel.lookupType(type, null);
        if (lookupType != null){
            return;
        } else if (AlbaHelper.isTypeNameValid(type)) {
            return;
        }

        throw new InvalidContent("Parameter type is not valid. Please use a type of the game model or one of " + Conf.privitiveTypes);
    }

    
    @PreUpdate
    public void validatePreUpdate() {
        validate();
    }

    @Override
    @XmlTransient
    public GmMethod getParent() {
        return method;
    }


}
