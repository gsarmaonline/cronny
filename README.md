# Cronny

## Seeding and running the app
```bash
# Seed the DB
make seed

# Run the Trigger app
make run
```

## Introduction
Cronly is a service which allows users to define different types of actions which can be triggered at different intervals. The intervals can be an absolute date, or a relative time.

## Elements

### Schedules
When the user defines a point in time when an action should be triggered, it is called a schedule. The schedule can be of multiple types:
- Absolute Date
    - (01/23/2025)
- Recurring interval
    - Every week on Monday
- Relative interval
    - After every 5 minutes
    - After every 1 hour 20 minutes

#### Schedule States
- Pending - When the Schedule doesn't have the relevant Triggers created as per the Schedule Interval
- Scheduled - When the equivalent schedule has been picked up for processing, i.e Trigger creation
- Processed - When there are no more Triggers required for the Schedule

### Trigger
Each Schedule can be expanded into different points in time where an Action should be taken. These points in time are called the Trigger. Whenever the Trigger fires, the Action should be performed.
Triggers are going to be the main units of scale for the infrastructure.

#### Trigger States
- Scheduled
- Executing
- Completed
- Failed

#### Trigger Components/Services
- Trigger Allocator
- Trigger Creator
- Trigger State management
- Trigger Infrastructure Forecaster
- Trigger Executor


#### Trigger Allocator
In this architecture, the Trigger Creator looks at the available Schedules, and creates a set of Triggers.
The Trigger Executor can ask the Allocator for some Triggers, which can then be executed. 
This is a pull based model where the Executor can define the amount of triggers it can execute in the next time interval.

Few assumptions:
- The Allocator should sort the set of Triggers based on the order in which it is to be executed. 
- The Allocator should send the Triggers only when it is near execution time. For example, it can send the Triggers for the next 5 minutes to the workers.
- The Allocator should be able to rearrange the sorted Trigger list when a new Schedule is added/modified/deleted.
- The Executor’s state of a Trigger should be tracked
- The weight or latency of a customer’s Action should not be able to affect other Triggers.

#### Creation of a Trigger
This section will cover when a Trigger needs to be created.
A Trigger can be created mainly from these sources:
- Schedule
- Recurring Trigger

Different Schedules will be governed by different granularity. The Triggers can be created based on the granularity of the respective schedule. For example, if we take a recurring schedule which should be executed every day, then the set of Triggers needs to be created only once a day for the existing Schedules. 
The Controller will run different workers per granularity,

#### Forecasting Trigger Workers requirements
- The number of Workers in different areas will depend on the number of Schedules, granularity of the Schedules, the number of Actions in the system.
- The Triggers should be created in such a way that it can be used as a feedback loop to the Infrastructure Controller scheduling the number of Workers.

#### Points to be decided later:
- Decide the time interval used by the Controller to mention that a given Trigger can be sent to the Worker
- Should we partition by the type or granularity of a Schedule?
- The completion of a Trigger should be tied to the completion of an Action or merely the invoking of the Action?

### Action
An action is the activity which is called by the service when the trigger is raised. 

Different types of Action definitions
- Run a docker container
- Pick UI stage
- Write code directly for the action

Each action can be a collection of complex stages. However, few common patterns emerge when we talk about different stages of actions.

Examples of Actions
- Make an API call, check the status of the API call. If the status call is anything apart from 200, then create a slack entry
- Make an API call, enter the data into a database

#### Default Action Stages
- Slack
- PagerDuty
- HTTP
- Docker
- Databases
- MySQL
- PostgreSQL
- Redis
- S3

### Connectors

Connectors define the connection of all the stages in an Action. Each Stage can take in the output of another Stage as an input and then create its own output.

A Connector should be able to direct the output to a corresponding Stage depending on the output. This will require the definition of conditionals and ESR functions.


## Infrastructure
### Requirements
- All pods should be stateless with the ability to focus on a certain subset of resources
- Pods for all services should be easily scaled up and down without loss in efficiency


