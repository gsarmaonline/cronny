package aws

import (
	"fmt"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/eventbridge"
)

type (
	AwsScheduler struct {
		config *aws.Config
	}
)

func NewAwsScheduler(config *aws.Config) (awsScheduler *AwsScheduler, err error) {
	awsScheduler = &AwsScheduler{
		config: config,
	}
	return
}

func (awsScheduler *AwsScheduler) Create() (err error) {
	// Create a new AWS session
	sess, err := session.NewSession(awsScheduler.config)
	if err != nil {
		fmt.Println("Failed to create AWS session:", err)
		return
	}

	// Create a new EventBridge client
	ebSvc := eventbridge.New(sess)

	// Define the event rule parameters
	ruleInput := &eventbridge.PutRuleInput{
		Name:               aws.String("my-scheduler-rule"),
		Description:        aws.String("My scheduled EventBridge rule"),
		ScheduleExpression: aws.String("rate(5 minutes)"), // Run the rule every 5 minutes
	}

	// Create the event rule
	_, err = ebSvc.PutRule(ruleInput)
	if err != nil {
		fmt.Println("Failed to create EventBridge rule:", err)
		return
	}
	fmt.Println("EventBridge rule created successfully")

	// Define the event target parameters
	targetInput := &eventbridge.PutTargetsInput{
		Rule: aws.String("my-scheduler-rule"),
		Targets: []*eventbridge.Target{
			{
				Id:  aws.String("my-target"),
				Arn: aws.String("arn:aws:lambda:us-west-2:123456789012:function:my-lambda-function"), // Replace with your Lambda function ARN
			},
		},
	}

	// Add the target to the event rule
	_, err = ebSvc.PutTargets(targetInput)
	if err != nil {
		fmt.Println("Failed to add target to EventBridge rule:", err)
		return
	}
	fmt.Println("EventBridge target added successfully")
	return
}
