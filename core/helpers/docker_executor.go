package helpers

import (
	"context"
	"encoding/json"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

type DockerExecutor struct {
	Image            string
	Registry         string
	RegistryUsername string
	RegistryPassword string
	client           *client.Client
	timeoutSec       int
	ctx              context.Context
}

func NewDockerExecutor(image string, registry, username, password string) (dockerExecutor *DockerExecutor, err error) {
	dockerExecutor = &DockerExecutor{
		Image:            image,
		Registry:         registry,
		RegistryUsername: username,
		RegistryPassword: password,
		timeoutSec:       15,
		ctx:              context.Background(),
	}
	if dockerExecutor.client, err = client.NewClientWithOpts(client.FromEnv); err != nil {
		return
	}
	return
}

func (dockerExecutor *DockerExecutor) Prepare() (resp container.CreateResponse, err error) {
	// Determine the full image name with registry if provided
	imageName := dockerExecutor.Image
	if dockerExecutor.Registry != "" {
		// If registry is provided, format the image name correctly
		imageName = dockerExecutor.Registry + "/" + dockerExecutor.Image
	}

	// Set up authentication for private registry if credentials are provided
	var pullOptions image.PullOptions
	if dockerExecutor.RegistryUsername != "" && dockerExecutor.RegistryPassword != "" {
		// Create auth configuration
		authConfig := map[string]string{
			"username": dockerExecutor.RegistryUsername,
			"password": dockerExecutor.RegistryPassword,
		}

		// Convert to JSON for Docker API
		encodedJSON, err := json.Marshal(authConfig)
		if err != nil {
			return resp, err
		}

		pullOptions = image.PullOptions{
			RegistryAuth: string(encodedJSON),
		}
	}

	// Pull the image with appropriate options
	if _, err = dockerExecutor.client.ImagePull(dockerExecutor.ctx, imageName, pullOptions); err != nil {
		return
	}

	// Create the container
	if resp, err = dockerExecutor.client.ContainerCreate(dockerExecutor.ctx, &container.Config{
		Image: imageName,
		Cmd:   []string{"echo", "Hello from Docker!"},
	}, nil, nil, nil, ""); err != nil {
		return
	}
	return
}

func (dockerExecutor *DockerExecutor) WaitAfterExecuting(createResp container.CreateResponse) (err error) {
	statusCh, errCh := dockerExecutor.client.ContainerWait(dockerExecutor.ctx, createResp.ID, container.WaitConditionNotRunning)
	timeout := time.After(time.Duration(dockerExecutor.timeoutSec) * time.Second)

	select {
	case err = <-errCh:
		if err != nil {
			break
		}
	case <-statusCh:
		break
	case <-timeout:
		if err = dockerExecutor.client.ContainerStop(dockerExecutor.ctx, createResp.ID, container.StopOptions{}); err != nil {
			break
		}
	}
	if err = dockerExecutor.client.ContainerRemove(dockerExecutor.ctx, createResp.ID, container.RemoveOptions{}); err != nil {
		return
	}
	return
}

func (dockerExecutor *DockerExecutor) Execute() (output string, err error) {
	var (
		createResp container.CreateResponse
	)
	if createResp, err = dockerExecutor.Prepare(); err != nil {
		return
	}
	if err = dockerExecutor.client.ContainerStart(dockerExecutor.ctx, createResp.ID, container.StartOptions{}); err != nil {
		return
	}
	if err = dockerExecutor.WaitAfterExecuting(createResp); err != nil {
		return
	}

	return
}
