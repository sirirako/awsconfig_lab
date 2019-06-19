# GRC334 - Build an effective security compliance program that continuously evaluates and remediates your security posture
In this session learn how to build a solution that will continuously evaluate your AWS resources for security compliance using AWS Config Rules, Amazon CloudWatch Events, and AWS Lambda. You will also learn how to improve your security posture by correcting or eliminating non-compliant resources.

## Prerequisites
* AWS Account
* IAM Account with Full Access

## Instruction
### Log in to AWS account and run Cloud Formation template
> In this section, we will create AWS resources uses for this session
   Cloud Formation is 
1. Go to CloudFormation Console, and click Create stack. For **Prerequisite - Preapare template**, select *Template is ready*.
2. Download the template from [here](https://raw.githubusercontent.com/sirirako/awsconfig_lab/master/templates/awsconfig_lab.json) to your machine.
3. Under Specify template, select *Upload a template file* and click *Choose file* button and select the Cloud Formation template downloaded from the previous step.

### Enable AWS Config to track configuration changes
> Before you can use AWS Config to detect In this section, we will enable AWS Config.
1. Go to AWS Config Console. If this is your first time using AWS Config, select Get started. If you’ve already used AWS Config, select Settings.
2. In the Settings page, under Resource types to record, select *Record all resources supported in this region* checkbox. 
3. Under Amazon S3 bucket, select *Create a bucket*.
4. Under Amazon SNS topic, check the box for *Stream configuration changes and notifications to an Amazon SNS topic*, and then select the radio button,  *Create a topic*.
5. Under AWS Config role, choose Create a role (unless you already have a role you want to use). 
5. If this is the first time using AWS Config, Click Next to Create Rule and follow the next section. Otherwise, click **Save** and follow the next section.
### Set up AWS Config rules
#### Scenario I: S3 Public Read access rule
> In this section, we will create a Config rule to detect S3 Bucket with Public Read access permission and manually correct its configuration.
   **s3-bucket-public-read-prohibited** Checks that your Amazon S3 buckets do not allow public read access. The rule checks the Block Public Access settings, the bucket policy, and the bucket access control list (ACL).
1. Go to AWS Config Console and click *Rule* from the left menu. (Skip this step if this is the first time using AWS Config.)
2. Click *+ Add Rule*, search and select s3-bucket-public-read-prohibited. Leave everything with default value in **Trigger** section.
3. In **Choose remediation action** section, select AWS-PubishSNSNotification. You need to provide SNS TopicArn and Message. In another tab, go to SNS 
4. Click Save. Wait a few minutes for the rule to apply. Examine the compliance and non-compliance S3 resource.
   There is one bucket that has Public Read permission.  Let's fix it.
5. This bucket will only be accessible from a specific network address. Go S3 console and search for this bucket.
6. Under Permission Tab, Bucket Policy, replace the existing policy with the following policy and click **Save**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::awsconfiglabstack-configbucket1bucket1d0a3ae24-173fadb7kccfj/*",
            "Condition": {
                "IpAddress": {
                    "aws:SourceIp": "54.240.143.0/24"
                }
            }
        }
    ]
}
```
7. Return to AWS Config console, *s3-bucket-public-read-prohibited* Rule then click **Re-evaluate**. 
8. Select S3 bucket resource. Click **Configuration timeline** to see the configuration change history. Click **Compliance timeline** to see the Compliance history for this resource. 

![AWS Config Rule](../master/images/awsconfig_s3bucket.png)

![Configuration Timeline](../master/images/awsconfig_configtimeline.png)

![Compliance Timeline](../master/images/awsconfig_compliancetimeline.png)

   Let's prevent Public Acess Configuration

9. Go to S3 console, S3 bucket. In **Permission** tab, delete existing Bukcet Policy.
10. Click **Block public access**, click **Edit**. Select *Block all public access* and click Save.
11. Now go back to Bucket Policy, enter the policy below which give Public Read Access to the world.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::awsconfiglabstack-configbucket1bucket1d0a3ae24-173fadb7kccfj/*"
        }
    ]
}

```
   You get Access Denied!!

12. Now try the policy in step 6. You are able to add policy that does not give Public Read Access to the world

#### Scenario II: Detecting S3 Public Read/Write access and remediate it with CloudWatch Event and Lambda Function
> In this section, we continue to use AWS Config Rule to detect S3 Public Read/Write Acess configuration. We will use CloudWatch Event and Lambda Function to automate the remediation.
1. Go to AWS Config Console and click *Rule* from the left menu
2. Click *+ Add Rule*, search and select s3-bucket-public-write-prohibited. Leave everything with default value in **Trigger** section.
3. In **Choose remediation action** section, select AWS-PubishSNSNotification and provide SNS TopicArn and Message.
4. Click Save. Wait a few minutes for the rule to apply. Examine the compliance and non-compliance S3 resource. Go to the non-compliance S3 Bucket and see why it is opened to the world. **Hint** Take a look at its Bucket Policy.
5. Go to AWS CloudWatch console. On the left menu, click Events.
6. Click **Create rule** button to creat a new rule. On Step 1: Create rule, under Event Source, select *Event Pattern* radio button. In the dropdown, select *Build cutomer event pattern*. Enter the following json text.
```json
{
  "source": [
    "aws.config"
  ],
  "detail": {
    "requestParameters": {
      "evaluations": {
        "complianceType": [
          "NON_COMPLIANT"
        ]
      }
    },
    "additionalEventData": {
      "managedRuleIdentifier": [
        "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
      ]
    }
  }
}
```
6. Under Targets, select *Lambda function* in the first dropdown. For **Function** name, search for *"AWSConfgLab"* and choose function name. This function was created with the Cloudformation in the earlier step. Click **Configure Detail**


![CloudWatch Event](../master/images/awsconfig_CWEvent.png)

7. Under **Step 2 : Configure rule details**, Rule definition, enter the rule name. Click Create rule.
8. Go to AWS Lambda Console, search and select the Lambda function in the earlier step. You can see that this function is triggered by CloudWatch Events.

![CloudWatch Event](../master/images/awsconfig_Lambda.png)

9. Go to AWS Config Console and click s3-bucket-public-write-prohibited rule. Click **Re-evaluate** button to manually trigger the rule. 

10. Let's look at the Lambda function code. This function accept CloudWatch Event as its parameter and look for the Bucket name with "NON_COMPLIANT" complianceType. Then it removes the Bucket Policy from this S3 Bucket.

```javascript
var AWS = require('aws-sdk');

exports.handler = function(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  // create AWS SDK clients
    var s3 = new AWS.S3({apiVersion: '2006-03-01'});
    var resource = event['detail']['requestParameters']['evaluations'];
    console.log("evaluations:", JSON.stringify(resource, null, 2));
    
for (var i = 0, len = resource.length; i < len; i++) {
  if (resource[i]["complianceType"] == "NON_COMPLIANT")
  {
      console.log(resource[i]["complianceResourceId"]);
      var params = {
        Bucket: resource[i]["complianceResourceId"]
      };

      s3.deleteBucketPolicy(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });
  }
}


};
```
11. Examine Lambda function Monitoring tab to see if the function has invoked. Click **View logs in CloudWatch** to see the logs generated from Lambda function.
12. Go back to AWS Config rule to see

#### Scenario III, Detecting Blacklisted application with AWS System Manager
> We will be using Inventory in AWS System Manager combine with AWS Config Rule to detect the unwanted application installed on EC2 instances.
1. In the AWS Management Console, go to the AWS Systems Manager console and choose Managed Instances on the left navigation pane. This should list all EC2 instances or on-premises managed instances in your account. 
2. Click **Setup Inventory** and select the EC2 instance you want to collect inventory from. In this exercise, select *Selecting all managed instances in this account*.
3. Click Setup Inventory to complete the action. Verify that the instance has collected an inventory of applications installed on the instance. 