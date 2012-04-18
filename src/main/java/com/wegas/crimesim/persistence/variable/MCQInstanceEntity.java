/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.crimesim.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
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
@XmlType(name = "MCQInstance")
public class MCQInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("MCQInstanceEntity");
    /**
     *
     */
    @OneToMany(mappedBy = "MCQInstance", cascade = {CascadeType.ALL}, orphanRemoval = true/*, fetch = FetchType.LAZY*/)
    @JsonManagedReference("question-replyi")
    @JoinColumn(name = "variableinstance_id")
    private List<MCQReplyInstanceEntity> replies = new ArrayList<MCQReplyInstanceEntity>();
    /**
     *
     */
    private boolean active = true;

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
    public List<MCQReplyInstanceEntity> getReplies() {
        return replies;
    }

    /**
     * @param replies the replies to set
     */
    public void setReplies(List<MCQReplyInstanceEntity> replies) {
//        this.replies.clear();
        this.replies = replies;

        //  if (replies != null) {
        for (MCQReplyInstanceEntity r : replies) {
            r.setMCQInstance(this);
        }
        //  }
    }

    /**
     *
     * @param reply
     */
    public void addReply(MCQReplyInstanceEntity reply) {
        this.replies.add(reply);
        reply.setMCQInstance(this);
    }

    @Override
    public void merge(AbstractEntity a) {
        MCQInstanceEntity vi = (MCQInstanceEntity) a;
        this.setActive(vi.getActive());

        List<MCQReplyInstanceEntity> newReplies = new ArrayList<MCQReplyInstanceEntity>();
        //newReplies.addAll(vd.getReplies());
        for (MCQReplyInstanceEntity nReply : vi.getReplies()) {
            int pos = this.replies.indexOf(nReply);
            if (pos == -1) {
                newReplies.add(nReply);
            } else {
                MCQReplyInstanceEntity oReply = this.replies.get(pos);
                oReply.merge(nReply);
                newReplies.add(oReply);
            }
        }
        this.setReplies(newReplies);
    }
    /*
    @Override
    public MCQInstanceEntity clone() {
    MCQInstanceEntity c = (MCQInstanceEntity) super.clone();
    //  List<MCQReplyInstanceEntity> replies = new ArrayList<MCQReplyInstanceEntity>();
    //  c.setReplies(replies);
    return c;
    }*/
}