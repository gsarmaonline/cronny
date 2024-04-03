run:
	make setup
	go run cmd/trigger.go

seed:
	mysql -uroot -ppassword -e "DROP DATABASE IF EXISTS cronny_dev;" 
	mysql -uroot -ppassword -e "DROP DATABASE IF EXISTS cronny_test;" 
	make setup
	go run cmd/seed/seed.go

setup:
	mysql -uroot -ppassword -e "CREATE DATABASE IF NOT EXISTS cronny_dev;" 
	mysql -uroot -ppassword -e "CREATE DATABASE IF NOT EXISTS cronny_test;" 
