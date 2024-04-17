package aws

import (
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/lambda"
)

type (
	AwsLambda struct {
		config *aws.Config
	}
)

func NewAwsLambda(config *aws.Config) (awsLambda *AwsLambda, err error) {
	awsLambda = &AwsLambda{
		config: config,
	}
	return
}

func (awsLambda *AwsLambda) Create() (err error) {
	sess, err := session.NewSession(awsLambda.config)
	if err != nil {
		fmt.Println("Failed to create AWS session:", err)
		os.Exit(1)
	}

	lambdaClient := lambda.New(sess)

	createFunctionInput := &lambda.CreateFunctionInput{
		FunctionName: aws.String("my-lambda-function"), // Replace with your desired function name
		Runtime:      aws.String("go1.x"),
		Role:         aws.String("arn:aws:iam::123456789012:role/my-lambda-role"), // Replace with your IAM role ARN
		Handler:      aws.String("main"),
		Code: &lambda.FunctionCode{
			ZipFile: []byte("H4sIAAAAAAAAAztQSVQqyi9KSdUr5ypUMAhw5ypUMAhw5ypUMAjQ5ypUMAhw5ypUNDIA"), // Replace with your Lambda function code
		},
	}

	result, err := lambdaClient.CreateFunction(createFunctionInput)
	if err != nil {
		fmt.Println("Failed to create Lambda function:", err)
		os.Exit(1)
	}

	fmt.Println("Lambda function created:", *result.FunctionArn)
	return
}
