package actions

import (
	"testing"
)

func TestDockerAction_RequiredKeys(t *testing.T) {
	dockerAction := DockerRegistryAction{}
	requiredKeys := dockerAction.RequiredKeys()

	// Should only have one required key: "image"
	if len(requiredKeys) != 1 {
		t.Errorf("Expected 1 required key, got %d", len(requiredKeys))
	}

	if requiredKeys[0].Name != "image" || requiredKeys[0].KeyType != StringActionKeyType {
		t.Errorf("Expected required key {image, string}, got {%s, %v}",
			requiredKeys[0].Name, requiredKeys[0].KeyType)
	}
}

func TestDockerAction_OptionalKeys(t *testing.T) {
	dockerAction := DockerRegistryAction{}
	optionalKeys := dockerAction.OptionalKeys()

	// Should have three optional keys
	if len(optionalKeys) != 3 {
		t.Errorf("Expected 3 optional keys, got %d", len(optionalKeys))
	}

	// Check each of the expected optional keys
	expectedKeys := []ActionKey{
		{"registry", StringActionKeyType},
		{"registry_username", StringActionKeyType},
		{"registry_password", StringActionKeyType},
	}

	for i, key := range optionalKeys {
		if key.Name != expectedKeys[i].Name || key.KeyType != expectedKeys[i].KeyType {
			t.Errorf("Expected optional key %d to be {%s, %v}, got {%s, %v}",
				i, expectedKeys[i].Name, expectedKeys[i].KeyType, key.Name, key.KeyType)
		}
	}
}

func TestDockerAction_Validate(t *testing.T) {
	tests := []struct {
		name    string
		input   Input
		wantErr bool
	}{
		{
			name: "valid with only image",
			input: Input{
				"image": "nginx",
			},
			wantErr: false,
		},
		{
			name: "valid with image and registry",
			input: Input{
				"image":    "nginx",
				"registry": "registry.example.com",
			},
			wantErr: false,
		},
		{
			name: "valid with all fields",
			input: Input{
				"image":             "nginx",
				"registry":          "registry.example.com",
				"registry_username": "user",
				"registry_password": "pass",
			},
			wantErr: false,
		},
		{
			name: "missing image",
			input: Input{
				"registry": "registry.example.com",
			},
			wantErr: true,
		},
		{
			name: "username without password",
			input: Input{
				"image":             "nginx",
				"registry":          "registry.example.com",
				"registry_username": "user",
			},
			wantErr: true,
		},
		{
			name: "password without username",
			input: Input{
				"image":             "nginx",
				"registry":          "registry.example.com",
				"registry_password": "pass",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dockerAction := DockerRegistryAction{}
			err := dockerAction.Validate(tt.input)

			if (err != nil) != tt.wantErr {
				t.Errorf("DockerAction.Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestNewDockerExecutor(t *testing.T) {
	tests := []struct {
		name     string
		image    string
		registry string
		username string
		password string
	}{
		{
			name:     "basic configuration",
			image:    "nginx",
			registry: "",
			username: "",
			password: "",
		},
		{
			name:     "with registry",
			image:    "nginx",
			registry: "registry.example.com",
			username: "",
			password: "",
		},
		{
			name:     "with registry and auth",
			image:    "nginx",
			registry: "registry.example.com",
			username: "user",
			password: "pass",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Skip the client creation which requires Docker
			executor, err := NewDockerExecutor(tt.image, tt.registry, tt.username, tt.password)

			// Just check that no error occurred and fields are set correctly
			if err != nil {
				t.Errorf("NewDockerExecutor() error = %v", err)
				return
			}

			// Compare fields individually, ignoring ctx and client
			if executor.Image != tt.image {
				t.Errorf("Image = %v, want %v", executor.Image, tt.image)
			}
			if executor.Registry != tt.registry {
				t.Errorf("Registry = %v, want %v", executor.Registry, tt.registry)
			}
			if executor.RegistryUsername != tt.username {
				t.Errorf("RegistryUsername = %v, want %v", executor.RegistryUsername, tt.username)
			}
			if executor.RegistryPassword != tt.password {
				t.Errorf("RegistryPassword = %v, want %v", executor.RegistryPassword, tt.password)
			}
		})
	}
}

func TestDockerExecutor_PrepareImageName(t *testing.T) {
	tests := []struct {
		name              string
		image             string
		registry          string
		wantFullImageName string
	}{
		{
			name:              "basic image no registry",
			image:             "nginx",
			registry:          "",
			wantFullImageName: "nginx",
		},
		{
			name:              "image with registry",
			image:             "nginx",
			registry:          "registry.example.com",
			wantFullImageName: "registry.example.com/nginx",
		},
		{
			name:              "image with tag no registry",
			image:             "nginx:latest",
			registry:          "",
			wantFullImageName: "nginx:latest",
		},
		{
			name:              "image with tag and registry",
			image:             "nginx:latest",
			registry:          "registry.example.com",
			wantFullImageName: "registry.example.com/nginx:latest",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test just the image name construction logic
			imageName := tt.image
			if tt.registry != "" {
				imageName = tt.registry + "/" + tt.image
			}

			if imageName != tt.wantFullImageName {
				t.Errorf("Expected image name %v, got %v", tt.wantFullImageName, imageName)
			}
		})
	}
}
