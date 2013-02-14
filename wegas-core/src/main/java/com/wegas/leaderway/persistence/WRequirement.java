package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import javax.persistence.Column;
import javax.persistence.Entity;

/**
 *
 * @author Benjamin
 */
@Entity                                                          
public class WRequirement extends VariableInstance {
    
    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Column(name = "wlimit")
    private Integer limit;
    /**
     * 
     */ 
    private Integer quantity;
    /**
     * 
     */
    @Column(name = "wlevel")
    private Integer level;

    @Override
    public void merge(AbstractEntity a) {
        WRequirement other = (WRequirement) a;
        this.setLimit(other.getLimit());
        this.setQuantity(other.getQuantity());
        this.setLevel(other.getLevel());
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
     * @return the quantity
     */
    public Integer getQuantity() {
        return quantity;
    }

    /**
     * @param quantity the quantity to set
     */
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
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
}