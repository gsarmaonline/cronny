run:
	make setup
	go run cmd/trigger.go

seed:
	make setup
	go run cmd/seed/seed.go

setup:
	mysql -uroot -e "CREATE DATABASE IF NOT EXISTS cronny_dev;" 
	mysql -uroot -e "CREATE DATABASE IF NOT EXISTS cronny_test;" 
