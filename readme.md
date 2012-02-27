Web Game Authoring system is a jee-based framework for multiplayer web-games developement.

School of Business and Engineering Vaud, http://www.heig-vd.ch/
Media Engineering, Information Technology Managment, Comem
Copyright (C) 2011

Authors
François-Xavier Aeberhard <fx@red-agent.com>
Cyril Junod <cyril.junod@gmail.com>


Setup
=======================
*PostgreSQL Server
**Add user to project’s persistence.xml file
*Glassfish Server
**Install glassfish v>3.1.1
**Enable comet support: 
can be done in netbeans:
right click on server >> properties >> check enable comet
**Enable websocket support:
asadmin set configs.config.server-config.network-config.protocols.protocol.http-listener-1.http.websockets-support-enabled=true
**Create PostgreSQL Connection pool
asadmin create-jdbc-connection-pool --datasourceclassname org.postgresql.ds.PGSimpleDataSource --restype javax.sql.DataSource --property portNumber=5432:password=fxpg02:user=fx:serverName=localhost:databaseName=wegas_dev jdbc/wegas_dev_pool
asadmin ping-connection-pool jdbc/wegas_dev_pool
asadmin create-jdbc-resource --connectionpoolid jdbc/wegas_dev_pool jdbc/wegas_dev

Set up Github
=======================
*Set up git [http://help.github.com/win-set-up-git/]
*git config --global user.name "Your Name"
*git config --global user.email YourMail
*mkdir Wegas
*cd Wegas
*git remote add origin git@github.com:fxaeberhard/Wegas.git
*git push -u origin master