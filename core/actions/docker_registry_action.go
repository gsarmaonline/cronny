package actions

import (
	"fmt"

	"github.com/cronny/core/helpers"
)

type (
	DockerRegistryAction struct{}
)

func (dockerAction DockerRegistryAction) RequiredKeys() (keys []ActionKey) {
	keys = []ActionKey{
		{"image", StringActionKeyType},
		// Registry information is optional
	}
	return
}

func (dockerAction DockerRegistryAction) OptionalKeys() (keys []ActionKey) {
	keys = []ActionKey{
		{"registry", StringActionKeyType},
		{"registry_username", StringActionKeyType},
		{"registry_password", StringActionKeyType},
	}
	return
}

func (dockerAction DockerRegistryAction) Validate(input Input) (err error) {
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

func (dockerAction DockerRegistryAction) Execute(input Input) (output Output, err error) {
	var (
		dockerExecutor *helpers.DockerExecutor
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
	if dockerExecutor, err = helpers.NewDockerExecutor(image, registry, username, password); err != nil {
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
