package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import java.io.Serializable;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Entity
@XmlRootElement
@XmlType(name = "")                                                             // This forces to use Class's short name as type
//@XmlAccessorType(XmlAccessType.FIELD)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class WRequirement extends AbstractEntity implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Column(name = "wrequirement_id")
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @Column(name = "wlimit")
    private Integer limit;
    /**
     *
     */
    @Column(name = "wwork")
    private String work;
    /*
     * 
     */
    @Column(name = "wlevel")
    private Integer level;
    /*
     * 
     */
    private Long quantity;

    public WRequirement() {
        this.limit = 0;
        this.work = "";
        this.level = 0;
        this.quantity = 0L;
    }

    @Override
    public void merge(AbstractEntity a) {
        WRequirement other = (WRequirement) a;
        this.setLevel(other.getLevel());
        this.setLimit(other.getLimit());
        this.setQuantity(other.getQuantity());
        this.setWork(other.getWork());
    }

    /**
     * @return the id
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * @return the limit
     */
    public Integer getLimit() {
        return limit;
    }

    /**
     * @param limit the limit to set
     */
    public void setLimit(Integer limit) {
        this.limit = limit;
    }

    /**
     * @return the work
     */
    public String getWork() {
        return work;
    }

    /**
     * @param work the work to set
     */
    public void setWork(String work) {
        this.work = work;
    }

    /**
     * @return the level
     */
    public Integer getLevel() {
        return level;
    }

    /**
     * @param level the level to set
     */
    public void setLevel(Integer level) {
        this.level = level;
    }

    /**
     * @return the quantity
     */
    public Long getQuantity() {
        return quantity;
    }

    /**
     * @param quantity the quantity to set
     */
    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }
}
