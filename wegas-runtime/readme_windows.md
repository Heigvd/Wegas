# Installing Wegas on a windows machine

## Install docker
https://docs.docker.com/get-docker/

## Clone wegas repo
`git clone git@github.com:Heigvd/Wegas.git wegas`

## Modify docker-compose.yml
Open `wegas-runtime/src/main/docker/wegas/docker-compose.yml` file and comment the `build` line. 

add this line at the same level as ports and environement:
`image: ghcr.io/heigvd/wegas:2.1.0`
/!\ the wegas version may change. Please ask your nice colleague about the latest version.


## Build and run docker container
Launch your docker application
In a bash console, go to `Wegas/wegas-runtime/src/main/docker/wegas`
use the command `docker compose up` at this path. 


Your container should run and you can now locally access wegas at the following adress:
localhost:8080 (If unsure about your port, check your docker container "wegas-1" in the application. By default the port is 8080).
