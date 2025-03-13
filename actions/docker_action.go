package actions

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

type (
	DockerAction   struct{}
	DockerExecutor struct {
		Image             string
		Registry          string
		RegistryUsername  string
		RegistryPassword  string
		client            *client.Client
		timeoutSec        int
		ctx               context.Context
	}
)

func NewDockerExecutor(image string, registry, username, password string) (dockerExecutor *DockerExecutor, err error) {
	dockerExecutor = &DockerExecutor{
		Image:             image,
		Registry:          registry,
		RegistryUsername:  username,
		RegistryPassword:  password,
		timeoutSec:        15,
		ctx:               context.Background(),
	}
	if dockerExecutor.client, err = client.NewClientWithOpts(client.FromEnv); err != nil {
		return
	}
	return
}

func (dockerAction DockerAction) RequiredKeys() (keys []ActionKey) {
	keys = []ActionKey{
		{"image", StringActionKeyType},
		// Registry information is optional
	}
	return
}

func (dockerAction DockerAction) OptionalKeys() (keys []ActionKey) {
	keys = []ActionKey{
		{"registry", StringActionKeyType},
		{"registry_username", StringActionKeyType},
		{"registry_password", StringActionKeyType},
	}
	return
}

func (dockerAction DockerAction) Validate(input Input) (err error) {
	// Check required keys
	if _, exists := input["image"]; !exists {
		return fmt.Errorf("missing required field: image")
	}
	
	// If registry credentials are provided, validate them
	if _, hasRegistry := input["registry"]; hasRegistry {
		// If registry is provided, check if both username and password are provided or neither
		hasUsername := false
		hasPassword := false
		
		if _, exists := input["registry_username"]; exists {
			hasUsername = true
		}
		
		if _, exists := input["registry_password"]; exists {
			hasPassword = true
		}
		
		// If one credential is provided but not the other, return an error
		if (hasUsername && !hasPassword) || (!hasUsername && hasPassword) {
			return fmt.Errorf("when providing registry credentials, both username and password must be provided")
		}
	}
	
	return nil
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

func (dockerAction DockerAction) Execute(input Input) (output Output, err error) {
	var (
		dockerExecutor *DockerExecutor
		image          string
		registry       string
		username       string
		password       string
	)
	if err = dockerAction.Validate(input); err != nil {
		return
	}
	
	// Extract required and optional parameters
	image = input["image"].(string)
	
	// Extract optional registry information if provided
	if regVal, exists := input["registry"]; exists && regVal != nil {
		registry = regVal.(string)
	}
	
	if regUser, exists := input["registry_username"]; exists && regUser != nil {
		username = regUser.(string)
	}
	
	if regPass, exists := input["registry_password"]; exists && regPass != nil {
		password = regPass.(string)
	}
	
	// Create Docker executor with all parameters
	if dockerExecutor, err = NewDockerExecutor(image, registry, username, password); err != nil {
		return
	}
	
	// Execute the Docker container
	if _, err = dockerExecutor.Execute(); err != nil {
		return
	}
	
	// Prepare successful output
	output = Output{
		"status":   "success",
		"image":    image,
		"registry": registry,
	}
	
	return
}
