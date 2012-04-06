/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.crimesim.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "MCQVariableDescriptor")
public class MCQDescriptorEntity extends VariableDescriptorEntity<MCQInstanceEntity> {

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
    private String tag;
    /**
     *
     */
    @JsonManagedReference("question-reply")
    @JoinColumn(name = "variabledescriptor_id")
    @OneToMany(mappedBy = "mCQVariableDescriptor", cascade = {CascadeType.ALL}, orphanRemoval = true)
    private List<MCQReplyDescriptorEntity> replies = new ArrayList<MCQReplyDescriptorEntity>();
    /**
     *
     */
    private boolean allowMultipleReplies = false;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        MCQDescriptorEntity vd = (MCQDescriptorEntity) a;
        this.setDescription(vd.getDescription());
        this.setLabel(vd.getLabel());
        this.setAllowMultipleReplies(vd.getAllowMultipleReplies());

        List<MCQReplyDescriptorEntity> newReplies = new ArrayList<MCQReplyDescriptorEntity>();
        //newReplies.addAll(vd.getReplies());
        for (MCQReplyDescriptorEntity nReply : vd.getReplies()) {
            int pos = this.replies.indexOf(nReply);
            if (pos == -1) {
                newReplies.add(nReply);
            } else {
                MCQReplyDescriptorEntity oReply = this.replies.get(pos);
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
    public List<MCQReplyDescriptorEntity> getReplies() {
        return replies;
    }

    /**
     * @param replies the replies to set
     */
    public void setReplies(List<MCQReplyDescriptorEntity> replies) {
        this.replies = replies;
        for (MCQReplyDescriptorEntity r : replies) {
            r.setMCQVariableDescriptor(this);
        }
    }

    /**
     *
     * @param reply
     */
    public void addReply(MCQReplyDescriptorEntity reply) {
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
     * @param allowMultipleReplies
     */
    public void setAllowMultipleReplies(boolean allowMultipleReplies) {
        this.allowMultipleReplies = allowMultipleReplies;
    }

    /**
     * @return the tag
     */
    public String getTag() {
        return tag;
    }

    /**
     * @param tag the tag to set
     */
    public void setTag(String tag) {
        this.tag = tag;
    }
}
