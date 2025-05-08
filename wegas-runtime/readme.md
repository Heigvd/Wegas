# Running Wegas

## Install tools
### Mac OS
```
#Install brew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

#Install OpenJDK 17
brew tap AdoptOpenJDK/openjdk
brew cask install adoptopenjdk17
or
brew install --cask adoptopenjdk17

#Install node
brew install node

#Install yarn
brew install yarn

#Install maven
brew install maven

#Install docker
brew cask install docker
or
brew install --cask docker
#Press ⌘ + Space to bring up Spotlight Search and enter "Docker" to launch Docker
```

## Install services

### PostgreSQL

#### Install
```shell
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=<YOUR_PASSWORD> --name wegas_postgres -d postgres:14-alpine 
```

##### 2
```shell
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=1234 -e POSTGRES_USER=user -e POSTGRES_DB=wegas_dev --name wegas_postgres -d postgres:14-alpine 
```

#### Configure
```shell
echo "CREATE USER \"user\" WITH PASSWORD '1234' SUPERUSER;
CREATE DATABASE \"wegas_dev\" OWNER \"user\";
CREATE DATABASE \"wegas_test\" OWNER \"user\";" |  docker exec -it wegas_postgres psql -U postgres
```

### Jackrabbit backend (MongoDB)
#### Install
```shell
docker run -p 27017:27017 --name wegas_mongo -d mongo:4.2
```

## Build
```shell
mvn -f .. -DskipTests install
```

### Java 17
If your default JVM is <> 17, you must provide the path to a JVM-17 to maven. E.G:
```shell
JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64/" mvn -DskipTests install
```
If this fails, remove the HOME_PATH from .mavenrc (leave it blank) so it defaults to the JVM-17 path.

#### Mac setup
If the above doesn't work, try the following to add java to your `$PATH`


Either set your `$PATH` by editing your `.zshrc` (or `.bashrc` depending on the shell you are using). Add the following line

```
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
```
Or alternatively, add a file (file name is irrelevant) in `/etc/paths.d` containing the path to java e.g. `/opt/homebrew/opt/openjdk@17/bin`  
All the files in this directory are automatically added to the `$PATH`.
## Test

### Private access
```bash
mvn -f .. test
```

### Public access
Since some tests require data from our private repository, please run tests with `-DskipPrivateTests` to skip them:

```bash
mvn -f .. -DskipPrivateTests clean install
```

## Run

### Start
Run `./run` to start wegas.

#### Java 17
Wegas is designed to run on Java 17. If your default JVM is lower or higher than 17, you must provide the path to a JVM 17 using the -j option.

#### Options
Option | Default Value | Description 
------ | ------------- | -----------
-d | 1 | number of populating daemon
-g | *unset* | to enable debug mode
-j | /usr/bin/ | path of the java executable
-m | 2G | heap size
-p | 9009 | debug port
-t | 9 | number of http threads
-w | ../wegas-app/target/Wegas | war to deploy

#### Clustering
Running several instance (localhost) at the same time will automatically create a cluster.

#### Custom Properties
First run creates `src/main/resources/wegas-override.properties` file.
Feel free to modify it.

#### Reload after wegas-core changes
```
mvn -f .. -pl wegas-app -am -DskipTests -DskipYarn install
touch ../wegas-app/target/Wegas/.reload
```

