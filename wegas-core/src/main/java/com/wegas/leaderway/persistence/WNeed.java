package com.wegas.leaderway.persistence;

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
public class WNeed implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Column(name = "wneed_id")
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
    @Column(name = "wlevel")
    private Integer level;
    
    private Long quantity;
    
    public WNeed() {
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
     * @return the id
     */
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
