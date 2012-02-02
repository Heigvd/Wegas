/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.persistence.variabledescriptor;

import com.albasim.wegas.persistence.AnonymousEntity;
import java.util.List;
import java.util.logging.Logger;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;


import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "MCQVariableDescriptor")
public class MCQVariableDescriptorEntity extends VariableDescriptorEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("MCQVariableDescriptorEntity");
    private String label;
    @Column(length=4096)
    private String description;
    @JsonManagedReference("question-reply")
    @OneToMany(mappedBy = "mcqVariableDescriptor", cascade = {CascadeType.ALL})
    private List<MCQVariableDescriptorReplyEntity> replies;

    /**
     * 
     * @param a
     */
    @Override
    public void merge(AnonymousEntity a) {
        super.merge(a);
        MCQVariableDescriptorEntity vd = (MCQVariableDescriptorEntity) a;
        this.setDescription(vd.getDescription());
        this.setReplies(vd.replies);
        this.setLabel(vd.getLabel());
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
     * @return the replies
     */
    public List<MCQVariableDescriptorReplyEntity> getReplies() {
        return replies;
    }

    /**
     * @param replies the replies to set
     */
    public void setReplies(List<MCQVariableDescriptorReplyEntity> replies) {
        this.replies = replies;
        for (MCQVariableDescriptorReplyEntity r : replies) {
            r.setMcqVariableDescriptor(this);
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
}
