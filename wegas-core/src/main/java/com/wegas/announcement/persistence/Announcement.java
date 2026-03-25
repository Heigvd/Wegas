package com.wegas.announcement.persistence;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.util.Collection;
import java.util.Date;

@Entity
@Table
public class Announcement extends AbstractEntity {

    @Id
    @GeneratedValue
    private Long id;

    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date createdTime = new Date();

    /**
     * Downtime start if any
     */
    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date startTime;

    /**
     * Downtime end if any
     */
    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date endTime;

    /**
     * When the message should start displaying
     */
    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date startDisplayTime;

    /**
     * When the message should stop displaying
     */
    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date endDisplayTime;

    /**
     * Displayed message to the user
     */
    @Lob
    private String message;

    /**
     * Don't change, used in DB
     */
    enum MessageType {
        INFO,
        WARNING,
    }

    @Enumerated(value = EnumType.STRING)
    @Column(length = 24, columnDefinition = "character varying(24) default 'INFO'::character varying")
    @NotNull
    private MessageType messageType = MessageType.INFO;

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestManager.RequestContext context) {
        return WegasMembership.ADMIN;
    }

    @Override
    public WithPermission getMergeableParent() {
        return null;
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return false;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "(" + this.getId() + ")";
    }

    /**** GETTER & SETTERS ***/

    public Date getStartTime() {
        return startTime;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public Date getEndTime() {
        return endTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    public Date getStartDisplayTime() {
        return startDisplayTime;
    }

    public void setStartDisplayTime(Date startDisplayTime) {
        this.startDisplayTime = startDisplayTime;
    }

    public Date getEndDisplayTime() {
        return endDisplayTime;
    }

    public void setEndDisplayTime(Date endDisplayTime) {
        this.endDisplayTime = endDisplayTime;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public MessageType getMessageType() {
        return messageType;
    }

    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }

}
