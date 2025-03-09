runall:
	make setup
	CRONNY_ENV=development go run cmd/all/all.go

runapi:
	make setup
	CRONNY_ENV=development go run cmd/api/api.go

seed:
	mysql -uroot -e "DROP DATABASE IF EXISTS cronny_dev;" 
	mysql -uroot -e "DROP DATABASE IF EXISTS cronny_test;" 
	make setup
	CRONNY_ENV=development go run cmd/seed/seed.go

setup:
	mysql -uroot -e "CREATE DATABASE IF NOT EXISTS cronny_dev;" 
	mysql -uroot -e "CREATE DATABASE IF NOT EXISTS cronny_test;" 

clean:
	mysql -uroot -e "DROP DATABASE IF EXISTS cronny_dev;" 
	mysql -uroot -e "DROP DATABASE IF EXISTS cronny_test;" 
	make setup

runexamples:
	bash api/examples.sh
