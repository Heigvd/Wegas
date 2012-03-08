/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.scope;

import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.AbstractEntity;
import com.wegas.core.persistence.game.TeamEntity;
import com.wegas.core.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.core.persistence.variableinstance.VariableInstanceEntity;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table()
@XmlType(name = "PlayerScope", propOrder = {"@class", "id", "name"})
public class PlayerScopeEntity extends ScopeEntity {

    private static final Logger logger = Logger.getLogger(PlayerScopeEntity.class.getName());
    //@EJB
    //@Transient
    // private WegasEntityManager wem;
    /*
    @ElementCollection(fetch=FetchType.EAGER)
    @MapKeyColumn(name = "id", insertable = false, updatable = false)
    @CollectionTable(
    //schema = "jpa",
    name = "varinst_map",
    joinColumns = @JoinColumn(name = "id"))*/
    // @OneToMany(mappedBy = "scope", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
   /* @XmlTransient*/
    //@MapKey
    // @JsonDeserialize(keyUsing = UserDeserializer.class)
    //private Map<UserEntity, VariableInstanceEntity> variableInstances= new HashMap<UserEntity, VariableInstanceEntity>();
    //  private Map<Long, VariableInstanceEntity> variableInstances = new HashMap<Long, VariableInstanceEntity>();
    /*
    @ElementCollection(fetch=FetchType.EAGER)
    @MapKeyColumn(name = "language", insertable = false, updatable = false)
    @CollectionTable(schema = "jpa", name = "multilingual_string_map",
    joinColumns = @JoinColumn(name = "string_id"))
    private Map<Long, VariableInstanceEntity> variableInstances = new HashMap<Long, VariableInstanceEntity>();*/
    /*
    @ElementCollection
    @MapKeyColumn(name="name")
    @Column(name="value")
    @CollectionTable(name="example_attributes", joinColumns=@JoinColumn(name="PlayerScopeEntity_id"))
    Map<String, String> attributes = new HashMap<String, String>();*/
    /**
     * @return the variableInstance
     */
    /*
     * FIXME Here we should use UserEntity reference and add a key deserializer module
     */
    //  @OneToMany(mappedBy = "scope", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    @OneToMany(mappedBy = "scope", cascade = {CascadeType.ALL})
    //@MapKey(name="id")
    @XmlTransient
    private Map<Long, VariableInstanceEntity> variableInstances = new HashMap<Long, VariableInstanceEntity>();

    /**
     *
     * @return
     */
    @Override
    public Map<Long, VariableInstanceEntity> getVariableInstances() {
        return this.variableInstances;
    }

    /**
     *
     * @param playerId
     * @return
     */
    @Override
    public VariableInstanceEntity getVariableInstance(Long playerId) {
        return this.variableInstances.get(playerId);
    }

    /**
     *
     * @param playerId
     * @param v
     */
    @Override
    public void setVariableInstance(Long playerId, VariableInstanceEntity v) {
        this.variableInstances.put(playerId, v);
        v.setScope(this);
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        propagateDefaultVariableInstance(false);
    }

    /**
     *
     * @param force
     */
    @XmlTransient
    @Override
    public void propagateDefaultVariableInstance(boolean force) {
        VariableDescriptorEntity vd = this.getVariableDescriptor();
        GameModelEntity gm = vd.getGameModel();
        for (GameEntity g : gm.getGames()) {
            for (TeamEntity t : g.getTeams()) {
                for (PlayerEntity p : t.getPlayers()) {
                    VariableInstanceEntity vi = this.variableInstances.get(p.getId());
                    if (vi == null) {
                        this.setVariableInstance(p.getId(), vd.getDefaultVariableInstance().clone());
                    } else if (force) {
                        vi.merge(vd.getDefaultVariableInstance());
                    }
                }
            }
        }
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
    }
}
/*
public class UuidMapKeyDeserializerModule extends Module {

@Override
public String getModuleName() {
return getClass().getName();
}

@Override
public Version version() {
return Version.unknownVersion();
}

@Override
public void setupModule(SetupContext context) {
context.addKeyDeserializers(new KeyDeserializers() {
@Override
public KeyDeserializer findKeyDeserializer(JavaType type, DeserializationConfig config, BeanDescription beanDesc, BeanProperty property) throws JsonMappingException {
if (type.getRawClass().equals(UUID.class)) {
return new UuidDeserializer();
}
return null;
}
});
}

private static class UuidDeserializer extends KeyDeserializer {
@Override
public UUID deserializeKey(String key, DeserializationContext ctxt) throws IOException {
return UUID.fromString(key);
}
}
}
class UserDeserializer extends StdKeyDeserializer {

protected UserDeserializer(Class<UserEntity> cls) {
super(cls);
}

@Override
protected Object _parse(String key, DeserializationContext ctxt) throws Exception {
ObjectMapper mapper = new ObjectMapper();
return mapper.readValue(key, UserEntity.class);
}
}*/
