/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "QuestionInstance")
public class QuestionInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;
    //private static final Logger logger = LoggerFactory.getLogger(QuestionInstanceEntity.class);
    /**
     *
     */
    @OneToMany(mappedBy = "questionInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference
    private List<ReplyEntity> replies = new ArrayList<>();
    /**
     *
     */
    private boolean active;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        QuestionInstanceEntity other = (QuestionInstanceEntity) a;
        this.setActive(other.getActive());
        this.replies.clear();
        this.addReplies(other.getReplies());
    }

    /**
     * @return the active
     */
    public boolean getActive() {
        return active;
    }

    /**
     * @param active the active to set
     */
    public void setActive(boolean active) {
        this.active = active;
    }

    /**
     * @return the replies
     */
    @JsonManagedReference
    public List<ReplyEntity> getReplies() {
        return replies;
    }

    /**
     * @param replies the replies to set
     */
    @JsonManagedReference
    public void setReplies(List<ReplyEntity> replies) {
        this.replies = replies;
    }

    /**
     *
     * @param reply
     */
    public void addReply(ReplyEntity reply) {
        this.replies.add(reply);
        reply.setQuestionInstance(this);
    }

    /**
     *
     * @param replies
     */
    public void addReplies(List<ReplyEntity> replies) {
        for (ReplyEntity r : replies) {
            this.addReply(r);
        }
    }
}