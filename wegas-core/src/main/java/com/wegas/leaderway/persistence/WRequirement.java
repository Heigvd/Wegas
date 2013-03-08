package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Benjamin
 */
@Entity
@XmlRootElement
@XmlType(name = "")                                                             // This forces to use Class's short name as type
//@XmlAccessorType(XmlAccessType.FIELD)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class WRequirement implements Serializable  {

    private static final long serialVersionUID = 1L;
    @Id
    @Column(name="wrequirement_id")
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
    @ElementCollection
    private Map<Integer, Integer> needs = new HashMap<>();

    
    public WRequirement () {
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
     * @return the needs
     */
    public Map<Integer, Integer> getNeeds() {
        return needs;
    }

    /**
     * @param needs the needs to set
     */
    public void setNeeds(Map<Integer, Integer> needs) {
        this.needs = needs;
    }
    
    /**
     * @return the need
     */
    public Integer getNeed(Integer key) {
        return needs.get(key);
    }

    /**
     * @param need the need to set
     */
    public void setNeed(Integer key, Integer value) {
        this.needs.put(key, value);
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
}
