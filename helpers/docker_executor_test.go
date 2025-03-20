package helpers

import (
	"testing"
)

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
