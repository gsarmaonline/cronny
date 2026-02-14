package main

import (
	"log"

	"github.com/cronny/core/api"
)

func main() {
	var (
		apiServer *api.ApiServer
		err       error
	)
	if apiServer, err = api.NewServer(nil); err != nil {
		log.Fatal(err)
	}
	if err = apiServer.Run(); err != nil {
		log.Fatal(err)
	}
}
