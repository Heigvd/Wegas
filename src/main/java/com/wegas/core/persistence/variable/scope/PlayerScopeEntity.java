/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.TeamEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
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
    /*
     * FIXME Here we should use UserEntity reference and add a key deserializer
     * module
     */
    @OneToMany(cascade = {CascadeType.ALL})
    @JoinColumn(name = "playerscope_id", referencedColumnName = "id")
    @XmlTransient
    private Map<Long, VariableInstanceEntity> variableInstances = new HashMap<>();

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
     * @param player
     * @return
     */
    @Override
    public VariableInstanceEntity getVariableInstance(PlayerEntity player) {
        return this.variableInstances.get(player.getId());
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
 * public class UuidMapKeyDeserializerModule extends Module {
 *
 * @Override public String getModuleName() { return getClass().getName(); }
 *
 * @Override public Version version() { return Version.unknownVersion(); }
 *
 * @Override public void setupModule(SetupContext context) {
 * context.addKeyDeserializers(new KeyDeserializers() { @Override public
 * KeyDeserializer findKeyDeserializer(JavaType type, DeserializationConfig
 * config, BeanDescription beanDesc, BeanProperty property) throws
 * JsonMappingException { if (type.getRawClass().equals(UUID.class)) { return
 * new UuidDeserializer(); } return null; } }); }
 *
 * private static class UuidDeserializer extends KeyDeserializer { @Override
 * public UUID deserializeKey(String key, DeserializationContext ctxt) throws
 * IOException { return UUID.fromString(key); } } } class UserDeserializer
 * extends StdKeyDeserializer {
 *
 * protected UserDeserializer(Class<UserEntity> cls) { super(cls); }
 *
 * @Override protected Object _parse(String key, DeserializationContext ctxt)
 * throws Exception { ObjectMapper mapper = new ObjectMapper(); return
 * mapper.readValue(key, UserEntity.class); } }
 */
