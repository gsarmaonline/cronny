# Cronny

## Deploying and running Cronny

### Locally

Take a look at [examples.sh](api/examples.sh.go) to understand how to create complex workflows using Cronny.

To seed an run the app, you can do:

```bash
# Seed the DB
make seed

# Run the Trigger app
make run

# Run the API server
make runapi

# Building the docker images
sudo docker build -t cronnyapi -f Dockerfile.api .
```

### Create and Execute schedules

```bash
#!/bin/bash
#

URL="http://127.0.0.1:8009"

# Job Template create
curl -XPOST $URL/api/cronny/v1/job_templates -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "http"
}
EOF

# Job Template create
curl -XPOST $URL/api/cronny/v1/job_templates -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "slack"
}
EOF

# Action create
curl -XPOST $URL/api/cronny/v1/actions -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "action-1"
}
EOF

# Job create
curl -XPOST $URL/api/cronny/v1/jobs -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "job-1",
    "action_id": 1,
    "job_type": "http",
    "job_input_type": "static_input",
    "job_input_value": "{\"method\": \"GET\", \"url\": \"https://jsonplaceholder.typicode.com/todos/1\"}",
    "is_root_job": true,
    "job_template_id": 1
}
EOF

# Schedule create
curl -XPOST $URL/api/cronny/v1/schedules -H 'Content-Type: application/json' --data @- << EOF
{
    "name": "schedule-1",
    "schedule_type": 3,
    "schedule_value": "10",
    "schedule_unit": "second",
    "action_id": 1
}
EOF

# Schedule update
curl -XPUT $URL/api/cronny/v1/schedules/1 -H 'Content-Type: application/json' --data @- << EOF
{
    "schedule_status": 1
}
EOF
```

### Fly.io (Deprecated)

```bash
curl -L https://fly.io/install.sh | sh

# Create fly token
fly tokens create deploy -x 999999h

# Launch the app
fly launch --image gsarmaonline/cronnyapi:latest
```

## Introduction

Cronly is a service which allows users to define different types of actions which can be
triggered at different intervals. The intervals can be an absolute date, relative time or
a recurring interval.

Cronny has 2 primary tasks:

- Planning
- Execution

The `Planning` state involves managing the schedules and deciding when a particular task should
be execute.
The `Execution` state involves how a particular task should be executed and what other components
are involved there.

## Planning Models

The `Planning` model mainly consists of the following tasks:

- Creation of a `Schedule`
- Creation of a `Trigger` when the time is right
- Execution of a `Trigger`

The philosophy behind introducing `Triggers` and the services related to it is to ensure that the actual
execution entity and the storage entities are separated from each other. This allows Cronny to scale whichever
part of the process is taking more resources.
For example, if the number of `Schedules` in the storage is very high, move the `Schedules` storage to a cold
storage for `Triggers` with delayed schedules, allowing us to cut costs quite a bit.
If the scheduling of jobs is taking a long time, then partition the storage referred by `Trigger Allocator` so
that concurrent allocation strategies can be designed.
The most common cost in the growth of resources is going to be borne by the `Trigger Executor` as it directly
correlates with the number of tasks to run and is usually very disproportionate.

### Schedules

When the user defines a point in time when an action should be triggered, it is called a schedule. The schedule can be of multiple types:

- Absolute Date
  - (01/23/2025)
- Recurring interval
  - Every week on Monday
  - Every day at 2pm
- Relative interval
  - After every 5 minutes
  - After every 1 hour 20 minutes

The Relative interval can be set to negative if there is any task that you would want to execute immediately.

#### Schedule States

- Pending - When the Schedule doesn't have the relevant Triggers created as per the Schedule Interval
- Scheduled - When the equivalent schedule has been picked up for processing, i.e Trigger creation
- Processed - When there are no more Triggers required for the Schedule

### Trigger

Each Schedule can be expanded into different points in time where an Action should be taken.
These points in time are called the Trigger. Whenever the Trigger fires, the Action should be performed.
Triggers are going to be the main units of scale for the infrastructure.

Trigger States

- Scheduled
- Executing
- Completed
- Failed

Trigger Services

- Trigger Allocator
- Trigger Creator
- Trigger Executor
- (WIP) Trigger State management
- (WIP) Trigger Infrastructure Forecaster

### Trigger Allocator

In this architecture, the Trigger Creator looks at the available Schedules, and creates a set of Triggers.
The Trigger Executor can ask the Allocator for some Triggers, which can then be executed.
This is a pull based model where the Executor can define the amount of triggers it can execute in the next time interval.

Few assumptions:

- The Allocator should sort the set of Triggers based on the order in which it is to be executed.
- The Allocator should send the Triggers only when it is near execution time. For example,
  it can send the Triggers for the next 5 minutes to the workers.
- The Allocator should be able to rearrange the sorted Trigger list when a new Schedule is added/modified/deleted.
- The Executor’s state of a Trigger should be tracked
- The weight or latency of a customer’s Action should not be able to affect other Triggers.

### Trigger Creator

This section will cover when a Trigger needs to be created.
A Trigger can be created mainly from these sources:

- Schedule
- Recurring Trigger

Different Schedules will be governed by different granularity. The Triggers can be created
based on the granularity of the respective schedule. For example, if we take a recurring
schedule which should be executed every day, then the set of Triggers needs to be created
only once a day for the existing Schedules.
The Controller will run different workers per granularity,

### Trigger Forecaster (WIP)

- The number of Workers in different areas will depend on the number of Schedules,
  granularity of the Schedules, the number of Actions in the system.
- The Triggers should be created in such a way that it can be used as a feedback
  loop to the Infrastructure Controller scheduling the number of Workers.

#### Points to be decided later:

- Decide the time interval used by the Controller to mention that a given Trigger can be sent to the Worker
- Should we partition by the type or granularity of a Schedule?
- The completion of a Trigger should be tied to the completion of an Action or merely the invoking of the Action?

### Action

An action is the activity which is called by the service when the trigger is raised.

Different types of Action definitions

- Run a docker container
- Pick UI job
- Write code directly for the action

Each action is a collection of complex jobs. However, few common patterns emerge when we talk about different jobs of actions.

Examples of Actions

- Make an API call, check the status of the API call. If the status call is anything apart from 200, then create a slack entry
- Make an API call, enter the data into a database

As an executing service, this is where the scheduling and trigger services end.
The next batch of models are going to refer directly with the execution model.

#### Default Action Jobs

- Slack
- PagerDuty
- HTTP
- Docker
- Databases
- MySQL
- PostgreSQL
- Redis
- S3

## Execution Models

The `Execution` models refers to the models involved in execution of an Action. Once the `Planning` model decides which
and when to execute a task, it hands over the control to the `Execution` models.
The `Execution` model supports the ability to execute simple jobs in order, chain I/O of jobs, conditional execution
of job depending on the I/O state.

The components here are:

- Job
- JobTemplate
- Condition
- Connector

### Job

The `Job` is the main functional unit of execution and connects or uses the other `Execution` models to execute.

The `Job` model can have 3 kinds of inputs:

- Static Input
- Output of another job as Input to current Job
- `JobInputTemplate`

Currently, each `Job` runs in a sequential manner, thus removing the need for concurrent access controls. The need for
concurrent models may not be required since the `Schedule` entity can run multiple `Triggers` if it needs parallelism.

Note: `JobTemplate` and `JobInputTemplate` entities are completely different.

### JobTemplate

Each `Job` is assigned a `JobTemplate` which is the type of task that needs to be performed.
As of writing this, the current `JobTemplate` models supported are:

1. HTTP
2. Slack
3. Logger

### JobInputTemplate

The `JobInputTemplate` model defines a string template per job allowing template parsing capabilities. This can be used by the user to
define jobs with a template where few key variables can be replaced by the output of another `Job`.

### Condition

The decision if a particular `Job` is to be executed can be controlled via the `Condition` model.
The `Condition` model has a set of `ConditionRules` which in turn has a set of `Filters` that it uses to compare the input of the job with.
The `Condition` model can be expanded to support a wide variety of rules in the future. In the current state as of writing it, the
`Condition` model only supports `Equality`, `GreaterThan`, and `LesserThan` conditions.

### Connectors

Connectors define the connection of all the jobs in an Action. Each Job can take in the output of another Job as an input and then create its own output.
A Connector should be able to direct the output to a corresponding Job depending on the output. This will require the definition of conditionals and ESR functions.

## Infrastructure

### Requirements

- All pods should be stateless with the ability to focus on a certain subset of resources
- Pods for all services should be easily scaled up and down without loss in efficiency

## Pricing philosophy

An important initial step to identify which features to enable and disable is identifying
the right price. In Cronny, all features will be available to everyone.
The pricing will be based on the number of resources your `cronnies` use.
For example, if your app uses all the features in the system and but runs only 100 times in
a month, you should most probably have to pay less than $10. On the other hand, if you
use only one feature but most of your tasks are long running and run for hours, it can cost
quite a bit as well.

## Benchmarking

### Possible points of failure

- Trigger creation
- Job execution resources
- Frequent jobs with lower thresholds

### TODO

- Convert the Trigger services into Dockerfiles
- Integrate with github workflow to create required docker images on pushing to master branch
- Create secret manager
- Create k8s deployment files for the individual services
- Support for different deployments
- Feedback loop on the number of Triggers available to scale in/out resources
