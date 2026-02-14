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
