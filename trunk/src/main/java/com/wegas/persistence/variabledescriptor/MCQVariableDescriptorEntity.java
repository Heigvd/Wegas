/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence.variabledescriptor;

import com.wegas.persistence.AnonymousEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;


import javax.persistence.JoinColumn;
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
    /**
     * 
     */
    private String label;
    /**
     * 
     */
    @Column(length = 4096)
    private String description;
    /**
     * 
     */
    @JsonManagedReference("question-reply")
    @JoinColumn(name = "variabledescriptor_id")
    @OneToMany(mappedBy = "mCQVariableDescriptor", cascade = {CascadeType.ALL}, orphanRemoval = true)
    private List<MCQVariableDescriptorReplyEntity> replies = new ArrayList<MCQVariableDescriptorReplyEntity>();
    /**
     * 
     */
    private boolean allowMultipleReplies = false;

    /**
     * 
     * @param a
     */
    @Override
    public void merge(AnonymousEntity a) {
        super.merge(a);
        MCQVariableDescriptorEntity vd = (MCQVariableDescriptorEntity) a;
        this.setDescription(vd.getDescription());
        this.setLabel(vd.getLabel());
        this.setAllowMultipleReplies(vd.getAllowMultipleReplies());

        List<MCQVariableDescriptorReplyEntity> newReplies = new ArrayList<MCQVariableDescriptorReplyEntity>();
        //newReplies.addAll(vd.getReplies());
        for (MCQVariableDescriptorReplyEntity nReply : vd.getReplies()) {
            int pos = this.replies.indexOf(nReply);
            if (pos == -1) {
                newReplies.add(nReply);
            } else {
                MCQVariableDescriptorReplyEntity oReply = this.replies.get(pos);
                oReply.merge(nReply);
                newReplies.add(oReply);
            }
        }
        this.setReplies(newReplies);
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
            r.setMCQVariableDescriptor(this);
        }
    }

    public void addReply(MCQVariableDescriptorReplyEntity reply) {
        this.replies.add(reply);
        reply.setMCQVariableDescriptor(this);
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
     * @return the multipleReplies
     */
    public boolean getAllowMultipleReplies() {
        return allowMultipleReplies;
    }

    /**
     * @param multipleReplies the multipleReplies to set
     */
    public void setAllowMultipleReplies(boolean allowMultipleReplies) {
        this.allowMultipleReplies = allowMultipleReplies;
    }
}
