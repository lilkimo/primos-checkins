sudo docker rm -f $(sudo docker ps -a -q --filter "ancestor=primos-checkins")
sudo docker rmi primos-checkins

sudo docker build . -t primos-checkins
sudo docker run -d -p 8080:80 primos-checkins
