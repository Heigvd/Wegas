/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

/**
 *
 * JerseyTest Framework is not cooperative enough...
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class GameModelControllerTest /*extends JerseyTest*/ {

//    @BeforeClass
//    public static void initContext() throws Exception {
//        System.out.println("[WeGAS Entity Test] Set up context...");
//        Map<String, Object> properties = new HashMap<>();
//        properties.put(EJBContainer.MODULES, new File[]{new File("target/classes")});
//        properties.put("org.glassfish.ejb.embedded.glassfish.installation.root", "./src/test/glassfish");
//
//        ejbContainer = EJBContainer.createEJBContainer(properties);
//        ctx = ejbContainer.getContext();
//        emf = Persistence.createEntityManagerFactory("wegasTestPU");
//        em = emf.createEntityManager();
//    }
//    @Test
//    public void createArticle() throws Exception {
//        HttpClient client = new HttpClient();
//        client.getHttpConnectionManager().getParams().setConnectionTimeout(5000);
//        PostMethod method = new PostMethod(url + "articles");
//        method
//        String xml = "<article><title>Jersey Article</title><text>text</text></article>";
//        RequestEntity requestEntity = new StringRequestEntity(xml, "application/xml", "UTF-8");
//        method.setRequestEntity(requestEntity);
//        client.executeMethod(method);
//        String responseBody = method.getResponseBodyAsString();
//        method.releaseConnection();
//        assertEquals("", responseBody);
//    }

//    @Test
//    public void testResourceAsJson() throws Exception {
//        HttpClient client = new HttpClient();
//        client.getHttpConnectionManager().getParams().setConnectionTimeout(5000);
//        HttpMethod method = new GetMethod(url + "GameModel/");
//        method.addRequestHeader("Accept", "application/json");
//        client.executeMethod(method);
//        String responseBody = method.getResponseBodyAsString();
//        System.out.println(responseBody);
//        method.releaseConnection();
//        assertTrue(responseBody.contains("\"title\":\"Jersey Article\""));
//    }
//    @Test
//    public void testResourceAsXml() throws Exception {
//        HttpClient client = new HttpClient();
//        client.getHttpConnectionManager().getParams().setConnectionTimeout(5000);
//        HttpMethod method = new GetMethod(url + "articles");
//        client.executeMethod(method);
//        String responseBody = method.getResponseBodyAsString();
//        System.out.println(responseBody);
//        method.releaseConnection();
//        assertTrue(responseBody.contains("<title>Jersey Article</title>"));
//    }
//
//    public GameModelControllerTest()throws Exception {
//        super("com.wegas.core.rest");
//    }
    /**
     * Test to see that the message "Hello World" is sent in the response.
     */
//    @Test
//    public void testHelloWorld() {
//        WebResource webResource = resource();
//        String responseMsg = webResource.path("GameModel/").get(String.class);
//        assertEquals("Hello World", responseMsg);
//    }
//
//    @BeforeClass
//    public static void setUpClass() throws Exception {
//    }
//
//    @AfterClass
//    public static void tearDownClass() throws Exception {
//    }
//
//    @Before
//    public void setUp() {
//    }
//
//    @After
//    public void tearDown() {
//    }
//    /**
//     * Test of index method, of class GameModelController.
//     */
//    @Test
//    public void testIndex() throws Exception {
//        System.out.println("index");
//        EJBContainer container = javax.ejb.embeddable.EJBContainer.createEJBContainer();
//        GameModelController instance = (GameModelController)container.getContext().lookup("java:global/classes/GameModelController");
//        Collection expResult = null;
//        Collection result = instance.index();
//        assertEquals(expResult, result);
//        container.close();
//        // TODO review the generated test code and remove the default call to fail.
//        fail("The test case is a prototype.");
//    }
//
//    /**
//     * Test of get method, of class GameModelController.
//     */
//    @Test
//    public void testGet() throws Exception {
//        System.out.println("get");
//        Long entityId = null;
//        EJBContainer container = javax.ejb.embeddable.EJBContainer.createEJBContainer();
//        GameModelController instance = (GameModelController)container.getContext().lookup("java:global/classes/GameModelController");
//        AbstractEntity expResult = null;
//        AbstractEntity result = instance.get(entityId);
//        assertEquals(expResult, result);
//        container.close();
//        // TODO review the generated test code and remove the default call to fail.
//        fail("The test case is a prototype.");
//    }
//
//    /**
//     * Test of create method, of class GameModelController.
//     */
//    @Test
//    public void testCreate() throws Exception {
//        System.out.println("create");
//        AbstractEntity entity = null;
//        EJBContainer container = javax.ejb.embeddable.EJBContainer.createEJBContainer();
//        GameModelController instance = (GameModelController)container.getContext().lookup("java:global/classes/GameModelController");
//        AbstractEntity expResult = null;
//        AbstractEntity result = instance.create(entity);
//        assertEquals(expResult, result);
//        container.close();
//        // TODO review the generated test code and remove the default call to fail.
//        fail("The test case is a prototype.");
//    }
//
//    /**
//     * Test of update method, of class GameModelController.
//     */
//    @Test
//    public void testUpdate() throws Exception {
//        System.out.println("update");
//        Long entityId = null;
//        AbstractEntity entity = null;
//        EJBContainer container = javax.ejb.embeddable.EJBContainer.createEJBContainer();
//        GameModelController instance = (GameModelController)container.getContext().lookup("java:global/classes/GameModelController");
//        AbstractEntity expResult = null;
//        AbstractEntity result = instance.update(entityId, entity);
//        assertEquals(expResult, result);
//        container.close();
//        // TODO review the generated test code and remove the default call to fail.
//        fail("The test case is a prototype.");
//    }
//
//    /**
//     * Test of delete method, of class GameModelController.
//     */
//    @Test
//    public void testDelete() throws Exception {
//        System.out.println("delete");
//        Long entityId = null;
//        EJBContainer container = javax.ejb.embeddable.EJBContainer.createEJBContainer();
//        GameModelController instance = (GameModelController)container.getContext().lookup("java:global/classes/GameModelController");
//        AbstractEntity expResult = null;
//        AbstractEntity result = instance.delete(entityId);
//        assertEquals(expResult, result);
//        container.close();
//        // TODO review the generated test code and remove the default call to fail.
//        fail("The test case is a prototype.");
//    }
//
//    /**
//     * Test of getWidgets method, of class GameModelController.
//     */
//    @Test
//    public void testGetWidgets() throws Exception {
//        System.out.println("getWidgets");
//        Long gameModelId = null;
//        EJBContainer container = javax.ejb.embeddable.EJBContainer.createEJBContainer();
//        GameModelController instance = (GameModelController)container.getContext().lookup("java:global/classes/GameModelController");
//        List expResult = null;
//        List result = instance.getWidgets(gameModelId);
//        assertEquals(expResult, result);
//        container.close();
//        // TODO review the generated test code and remove the default call to fail.
//        fail("The test case is a prototype.");
//    }

//    public MainTest()throws Exception {
//        super();
//        ApplicationDescriptor appDescriptor = new ApplicationDescriptor();
//        appDescriptor.setRootResourcePackageName("com.sun.jersey.samples.entityprovider");
//        super.setupTestEnvironment(appDescriptor);
//    }
//
//    /**
//     * Test if a WADL document is available at the relative path
//     * "application.wadl".
//     */
//    @Test
//    public void testApplicationWadl() {
//        String serviceWadl = webResource.path("application.wadl").
//                accept(MediaTypes.WADL).get(String.class);
//        assertTrue(serviceWadl.length() > 0);
//    }
//
//    /**
//     * Test checks that a request to properties resource gives back
//     * a list of properties that contains the "java.class.path"
//     * property.
//     */
//    @Test
//    public void testPropertiesResource() throws IOException {
//        String sProperties = webResource.path("properties").accept(MediaType.TEXT_PLAIN).get(String.class);
//        Properties properties = new Properties();
//        properties.load(new ByteArrayInputStream(sProperties.getBytes()));
//        assertNotNull("Properties does not contain 'java.class.path' property",
//                properties.getProperty("java.class.path"));
//    }
//
//    /**
//     * Test checks that a GET request on "data" resource gives back a reponse
//     * with status "OK".
//     */
//    @Test
//    public void testGetOnDataResource() {
//        ClientResponse response = webResource.path("data").accept(MediaType.TEXT_HTML).get(ClientResponse.class);
//        assertEquals("Request for data doesn't give expected response.",
//                Response.Status.OK, response.getResponseStatus());
//    }
//
//    /**
//     * Test checks that a POST on "data" resource adds the submitted data to
//     * the maintained map.
//     */
//    @Test
//    public void testPostOnDataResource() {
//        Form formData = new Form();
//        formData.add("name", "testName");
//        formData.add("value", "testValue");
//        ClientResponse response = webResource.path("data").type(MediaType.APPLICATION_FORM_URLENCODED).post(ClientResponse.class, formData);
//        assertEquals(Response.Status.OK, response.getResponseStatus());
//        String responseMsg = webResource.path("data").type(MediaType.TEXT_HTML).get(String.class);
//        assertTrue("Submitted data did not get added to the list...",
//                responseMsg.contains("testName") && responseMsg.contains("testValue"));
//
//    }
//}
}
