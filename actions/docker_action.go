package actions

import (
	"context"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

type (
	DockerAction   struct{}
	DockerExecutor struct {
		Image      string
		client     *client.Client
		timeoutSec int
		ctx        context.Context
	}
)

func NewDockerExecutor(image string) (dockerExecutor *DockerExecutor, err error) {
	dockerExecutor = &DockerExecutor{
		Image:      image,
		timeoutSec: 15,
		ctx:        context.Background(),
	}
	if dockerExecutor.client, err = client.NewClientWithOpts(client.FromEnv); err != nil {
		return
	}
	return
}

func (dockerAction DockerAction) RequiredKeys() (keys []ActionKey) {
	keys = []ActionKey{
		{"image", StringActionKeyType},
	}
	return
}

func (dockerAction DockerAction) Validate(input Input) (err error) {
	return
}

func (dockerExecutor *DockerExecutor) Prepare() (resp container.CreateResponse, err error) {
	if _, err = dockerExecutor.client.ImagePull(dockerExecutor.ctx, dockerExecutor.Image, image.PullOptions{}); err != nil {
		return
	}
	if resp, err = dockerExecutor.client.ContainerCreate(dockerExecutor.ctx, &container.Config{
		Image: dockerExecutor.Image,
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
	)
	if err = dockerAction.Validate(input); err != nil {
		return
	}
	if dockerExecutor, err = NewDockerExecutor(input["image"].(string)); err != nil {
		return
	}
	if _, err = dockerExecutor.Execute(); err != nil {
		return
	}
	return
}
