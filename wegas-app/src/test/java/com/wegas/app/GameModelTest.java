/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.security.ejb.UserFacade;
import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import junit.framework.Assert;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.glassfish.embeddable.GlassFishException;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
abstract public class GameModelTest {

    private static EJBContainer container;
    protected static GameModelFacade gmFacade;
    protected GameModel gm;
    protected Player player;

    protected abstract String getGameModelPath();

    @BeforeClass
    public static void setUp() throws Exception {

        Map<String, Object> properties = new HashMap<>();                       // Init Ejb container
        properties.put(EJBContainer.MODULES, new File[]{new File("../wegas-core/target/embed-classes")});
        properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "../wegas-core/src/test/glassfish");
        //properties.put(EJBContainer.APP_NAME,"class");
        //ejbContainer.getContext().rebind("inject", this);

        // Init shiro
        SecurityUtils.setSecurityManager(new IniSecurityManagerFactory("classpath:shiro.ini").getInstance());
        Logger.getLogger("javax.enterprise.system.tools.deployment").setLevel(Level.OFF);
        Logger.getLogger("javax.enterprise.system").setLevel(Level.OFF);

        container = EJBContainer.createEJBContainer(properties);
        Helper.lookupBy(container.getContext(), UserFacade.class, UserFacade.class).guestLogin(); //login as guest

        gmFacade = Helper.lookupBy(container.getContext(), GameModelFacade.class, GameModelFacade.class);
    }

    @AfterClass
    public static void tearDown() throws GlassFishException {
        container.close();
    }

    @Before
    public void setUpGM() throws IOException {
        gm = this.createGameModelFromFile(this.getGameModelPath());
        player = gm.getPlayers().get(0);
    }

    @After
    public void cleanGM() {
        gmFacade.remove(gm.getId());
    }

    protected GameModel createGameModelFromFile(String path) throws IOException {
        String pmg = TestHelper.readFile(path);
        GameModel gameModel = JacksonMapperProvider.getMapper().readValue(pmg, GameModel.class);
        System.out.println("Create game model : " + gameModel.getName());
        gmFacade.create(gameModel);
        Assert.assertNotNull(gameModel.getId()); //persisted
        return gameModel;
    }

    protected <T> T lookup(Class<T> className) {
        try {
            return Helper.lookupBy(container.getContext(), className, className);
        } catch (NamingException ex) {
            return null;
        }
    }
}
