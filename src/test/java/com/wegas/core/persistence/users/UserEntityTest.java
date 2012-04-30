/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.persistence.users;

import com.wegas.core.persistence.user.UserEntity;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import java.util.List;
import org.junit.*;
import static org.junit.Assert.*;

/**
 *
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class UserEntityTest {

    public UserEntityTest() {
    }

    @BeforeClass
    public static void setUpClass() throws Exception {
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

    /**
     * Test of getId method, of class UserEntity.
     */
    @Test
    public void testGetId() {
        System.out.println("getId");
        UserEntity instance = new UserEntity();

        Long expResult = null;
        Long result = instance.getId();
        assertEquals(expResult, result);
    }

    /**
     * Test of setId method, of class UserEntity.
     */
    @Test
    public void testSetId() {
        System.out.println("setId");
        Long id = null;
        UserEntity instance = new UserEntity();
        instance.setId(id);
        assertEquals(id, instance.getId());

        id = new Long(213);
        instance.setId(id);
        assertEquals(id, instance.getId());

    }

    /**
     * Test of getName method, of class UserEntity.
     */
    /*
    @Test
    public void testGetName() {
        System.out.println("getName");
        UserEntity instance = new UserEntity();
        String expResult = null;
        String result = instance.getName();
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        //fail("The test case is a prototype.");
    }*/

    /**
     * Test of setName method, of class UserEntity.
     */
   /*
    @Test
    public void testSetName() {
        System.out.println("setName");
        String name = "";
        UserEntity instance = new UserEntity();
        instance.setName(name);
        // TODO review the generated test code and remove the default call to fail.
       // fail("The test case is a prototype.");
    }
*/
    /**
     * Test of merge method, of class UserEntity.
     */
    /*
    @Test
    public void testMerge() {
        System.out.println("merge");
        AbstractEntity a = null;
        //UserEntity instance = new UserEntity();
        //instance.merge(a);
        // TODO review the generated test code and remove the default call to fail.
       // fail("The test case is a prototype.");
    }
*/
    /**
     * Test of getPlayers method, of class UserEntity.
     */
    /*
    @Test
    public void testGetPlayers() {
        System.out.println("getPlayers");
        UserEntity instance = new UserEntity();
        List expResult = null;
        List result = instance.getPlayers();
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        ///fail("The test case is a prototype.");
    }
*/
    /**
     * Test of setPlayers method, of class UserEntity.
     */
    /*
    @Test
    public void testSetPlayers() {
        System.out.println("setPlayers");
        List<PlayerEntity> players = null;
        UserEntity instance = new UserEntity();
        instance.setPlayers(players);
        // TODO review the generated test code and remove the default call to fail.
        //fail("The test case is a prototype.");
    }
    */

}
