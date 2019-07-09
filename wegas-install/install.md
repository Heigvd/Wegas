# Installing Wegas (For ubuntu dists)
* Install git  
`sudo apt-get -y install git`
* Clone Wegas and submodules
```shell
git clone git@github.com:Heigvd/Wegas.git Wegas
cd Wegas
git submodule init
git config submodule.wegas-app/src/main/webapp/wegas-private.url git@github.com:Heigvd/WegasPrivate.git
git submodule update
cd ..
```
* Install openJDK >= 1.8.0  
`sudo apt-get -y install openjdk-8-jdk`
* (if using alternatives) update alternatives by choosing installed jdk as main  
`sudo update-alternatives --config java`
* Install postgressql and setup user and db
```shell
sudo apt-get -y install postgresql postgresql-contrib
sudo -u postgres psql
CREATE USER "user" WITH PASSWORD '1234' SUPERUSER;
CREATE DATABASE "wegas_dev";
CREATE DATABASE "wegas_test";
\q
```
* Install maven (> 3.5.2)  
`sudo apt-get -y install maven`
* Install yarn
```shell
sudo apt-get install -y nodejs npm
sudo npm install yarn -g
```
* Install mango (with docker)
```shell
sudo apt-get -y install docker.io
sudo docker pull mongo
sudo docker run -p 27017:27017 --name wegasmongo -d mongo
sudo docker start wegasmongo
```

* Build the app
`mvn clean install`


### Using the preconfigured runner
* (optional) Add your pusher credentials to the file `/wegas-run/lib/classes/wegas-override.properties`
* Launch the server  
```shell
cd wegas-run
./run.sh
```
------------------------
### Using payara-standard
* Install payara-full
```shell
#Installing payara
wget https://search.maven.org/remotecontent?filepath=fish/payara/distributions/payara/4.1.2.181/payara-4.1.2.181.zip -O payara.zip
unzip payara.zip
sudo rm -rf payara.zip
#Installing jcdb driver
wget https://jdbc.postgresql.org/download/postgresql-9.4.1212.jar
mv postgresql-9.4.1212.jar payara41/glassfish/domains/wegasdomain/lib
#Setting up config
cp -r payara41/glassfish/domains/payaradomain/ payara41/glassfish/domains/wegasdomain
cp wegas-install/defaultdomain.xml payara41/glassfish/domains/wegasdomain/config/domain.xml
#Setting up wegas env variables
cp wegas-install/defaultwegas-override.properties payara41/glassfish/domains/wegasdomain/lib/classes/wegas-override.properties
```
* (optional) Insert your pusher credentials in  
`payara41/glassfish/domains/wegasdomain/lib/classes/wegas-override.properties`
* Start payara  
`sudo payara41/bin/asadmin start-domain wegasdomain`

### Using payara-micro (Not working now)
* Install payara micro
```shell
cd wegas-run
wget https://s3-eu-west-1.amazonaws.com/payara.fish/Payara+Downloads/5.192/payara-micro-5.192.jar payara-micro.jar
```
* Install postgress JDBC driver
```shell
cd lib
wget https://jdbc.postgresql.org/download/postgresql-42.2.6.jar
```

* Deploy app
`sudo payara41/bin/asadmin deploy wegas-app/target/Wegas.war`
------------------------

* Launch the wegas-next client for dev purposes
```shell
cd wegas-app/src/main/webapp/2
yarn start
```
* Browse the URL `localhost:3000/Wegas` and enter with user `root` and password `1234`

* Welcome to the Watrix!

------------------------
## Troubleshooting
* Maven : If your linux dist is too old and maven is < 3.5.2
```shell
sudo tar xzf apache-maven-3.6.0-bin.tar.gz
sudo ln -s apache-maven-3.6.0 apache-maven
sudo update-alternatives --config mvn
```
* Yarn : If cmdtest is installed and yarn is ghosted
```shell
sudo apt-get remove cmdtest
sudo apt-get -y install curl 
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get -y install nodejs-legacy
sudo npm install yarn -g
```
* PSQL :
 - If PSQL tells you there is no colon named "locked" or payara says MigrationFailedException :
```
sudo -u postgres psql
DROP DATABASE "wegas_dev";
DROP DATABASE "wegas_test";
CREATE DATABASE "wegas_dev";
CREATE DATABASE "wegas_test";
\q
```
* Enable Hazelcast [payara admin console](http://localhost:4848/)/server-config/Hazelcast
