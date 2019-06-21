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
2. Download the template from [here](https://raw.githubusercontent.com/sirirako/awsconfig_lab/master/templates/awsconfig_lab.yml) to your machine.
3. Under Specify template, select *Upload a template file* and click *Choose file* button and select the Cloud Formation template downloaded from the previous step.
4. Enter Stack name. Keep the rest at the default value and click **Next**. 
5. On the Review Test step, in the Capabilities section, check the check box *I acknowledge that AWS CloudFormation might create IAM resources with custom names.* and complete the Stack creation.

### Enable AWS Config to track configuration changes
> Before you can use AWS Config to detect In this section, we will enable AWS Config.
1. Go to AWS Config Console. If this is your first time using AWS Config, select Get started. If you’ve already used AWS Config, select Settings.
2. In the Settings page, under Resource types to record, select *Record all resources supported in this region* checkbox. 
3. Under Amazon S3 bucket, select *Create a bucket*.
4. Under Amazon SNS topic, check the box for *Stream configuration changes and notifications to an Amazon SNS topic*, and then select the radio button,  *Create a topic*.
5. Under AWS Config role, choose Create *AWS Config service-linkded role.* (unless you already have a role you want to use). 
5. If this is the first time using AWS Config, Click **Next** to Create Rule. Click **Skip** to go to Review page. Click **Confirm**

### Create another SNS Topic for Config Rule violation notification.
1. In another browser tab, go to SNS Console. Click **Topics** in the left menu and click **Create topic**.
2. Enter the Topic Name then click **Create Topic**. Take note of SNS topic ARN.
3. **Optional** Click **Create subscription**, select *Email* for Protocol and enter an email address for Endpoint. You will receive and email with an instruction to confirm the subscription.

![AWS Config Rule](../master/images/awsconfig_SNS.png)

### Scenario I: S3 Public Read access rule
> In this section, we will create a Config rule to detect S3 Bucket with Public Read access permission and manually correct its configuration. 
   **s3-bucket-public-read-prohibited** Checks that your Amazon S3 buckets do not allow public read access. The rule checks the Block Public Access settings, the bucket policy, and the bucket access control list (ACL).
1. Go to AWS Config Console and click *Rule* from the left menu. Click *+ Add Rule*. 
2. In AWS Config rules page, Search and select *s3-bucket-public-read-prohibited*. Leave the settings in **Trigger** section with default value.
3. In **Choose remediation action** section, select AWS-PubishSNSNotification. You need to provide SNS TopicArn from the previous section and Message. 
4. Click Save. Wait a few minutes for the rule to apply. Examine the compliance and non-compliance S3 resource.
   There is two bucket that has Public Read permission.  Let's fix one of them manually.

![AWS Config Rule](../master/images/awsconfig_readrulenoncompliance.png)

5. Under Noncompliant status, click awsconfig-configbucket1bucket1xxxxxxx. We will ensure that this bucket will only be accessible from a specific network address. Click **Manage resource** button which will take you to S3 console.
6. Under Permission Tab, Bucket Policy, replace the existing policy with the following policy. Replace **Resources**'s value with your S3 ARN and click **Save**. Alternatively, add the Condition value below to the existing Bucket Policy.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::awsconfiglabstack-configbucket1bucket1xxxxxxxxxxxxx/*",
            "Condition": {
                "IpAddress": {
                    "aws:SourceIp": "54.240.143.0/24"
                }
            }
        }
    ]
}
```
7. Return to AWS Config console, *s3-bucket-public-read-prohibited* Rule then click **Re-evaluate**. It will take a few minutes for the rule to detect the change. Now there is only one bucket that is noncompliant.

![AWS Config Rule](../master/images/awsconfig_readrulenoncompliance2.png)

8. Under Compliance status, select *Complaint* from the dropdown menu to filter the list. Select S3 bucket resource that we made Bucket Policy changed earlier. Click **Configuration timeline** to see the configuration change history. Click **Compliance timeline** to see the Compliance history for this resource. 

![AWS Config Rule](../master/images/awsconfig_s3bucket.png)

![Configuration Timeline](../master/images/awsconfig_configtimeline.png)

![Compliance Timeline](../master/images/awsconfig_compliancetimeline.png)

   Let's prevent Public Acess Configuration

9. Click *Manage Resource* to Go to S3 console, S3 bucket. In **Permission** tab, click Bucket Policy and click delete to remove the existing Bukcet Policy.
10. Click **Block public access**, click **Edit**. Select *Block all public access* and click Save amd confirm the change.
11. Now go back to Bucket Policy, enter the policy below which give Public Read Access to the world. Replace the *Resource*'s value with your S3 Bucket Arn.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::awsconfiglabstack-configbucket1bucket1xxxxxxxxxxx/*"
        }
    ]
}

```
   You get Access Denied!!

12. Now try the policy in step 6. You are able to add policy that does not give Public Read Access to the world

### Let's use System Manager Document to remediate the noncompliant.

13. Go back to S3 bucket in **Permission** tab, click Bucket Policy. Click **Block public access**, click **Edit**. uncheck *Block all public access* and click Save amd confirm the change. For Bucket Policy, remove the Conditon for IP Address from the policy. Now this bucket has Read access and noncompliant.
14. Go to System Manager Console, click Documents under Shared Resources on the left menu.
15. Click Create Document, type **Name:** *My-DisableS3ReadAccess* and select **Document type:** *Automation document*
16. Under Content, select YAML and copy the code below. Click Create document.

```yaml
---
description: Disable S3-Bucket's public WriteRead access via private ACL
schemaVersion: "0.3"
assumeRole: "{{ AutomationAssumeRole }}"
parameters:
  S3BucketName:
    type: String
    description: (Required) S3 Bucket subject to access restriction
  AutomationAssumeRole:
    type: String
    description: (Optional) The ARN of the role that allows Automation to perform the actions on your behalf.
    default: ""
mainSteps:
- name: DisableS3BucketPublicReadWrite
  action: aws:executeAwsApi
  inputs:
    Service: s3
    Api:  PutPublicAccessBlock
    Bucket: "{{S3BucketName}}"
    PublicAccessBlockConfiguration: 
      BlockPublicAcls: true
      IgnorePublicAcls: true
      BlockPublicPolicy: true
      RestrictPublicBuckets: true
  isEnd: true
...
```
17. Go back to AWS Config console, select the radio button for rule *s3-bucket-public-read-prohibited* and click Manage remediation button.
18. Click Delete remediation action to delete the existing one (AWS-PubishSNSNotification).
19. For Remediation action dropdown, finde the System Mananger Document created earlier, *My-DisableS3Access*.
20. For Resource ID parameter, select S3BucketName. Click **Save**.

![](../master/images/awsconfig_ssmremediation.png)

21. Re-evaluate the rule and you should see this bucket has Noncompliant status.
22. Select the resource and click Remediate. When complete, click *Re-evaluate the rule.

![](../master/images/awsconfig_remediate.png)

23. Go back to the S3 Bucket and go to Permissions tab. Check the **Block public access** settings.

#### Scenario II: Detecting S3 Public Read/Write access and remediate it with CloudWatch Event and Lambda Function
> In this section, we continue to use AWS Config Rule to detect S3 Public Read/Write Acess configuration. We will use CloudWatch Event and Lambda Function to automate the remediation.
1. Go to AWS Config Console and click *Rule* from the left menu
2. Click *+ Add Rule*, search and select *s3-bucket-public-write-prohibited*. Leave everything with default value in **Trigger** section.
3. In **Choose remediation action** section, select AWS-PubishSNSNotification and provide SNS TopicArn and Message.
4. Click Save. Wait a few minutes for the rule to apply. Examine the compliance and non-compliance S3 resource. Go to the non-compliance S3 Bucket and see why it is opened to the world. **Hint** Take a look at its Bucket Policy.
   Next, we are going to use AWS CloudWatch event and AWS Lambda to automatically remediate the noncompliant.
5. Go to AWS CloudWatch console. On the left menu, click Rules under Events.
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

7. Under **Step 2 : Configure rule details**, Rule definition, enter the rule name. Click **Create rule**.
8. Go to AWS Lambda Console, search and select the Lambda function in the earlier step. You can see that this function is triggered by CloudWatch Events.

![CloudWatch Event](../master/images/awsconfig_lambda.png)

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
2. Click **Setup Inventory** and select the EC2 instance you want to collect inventory from. In this exercise, select *Specifying a tag* and enter Name for Tag key and AwsconfigLabStack/ec2fleet/ASG* for Tag value.

![](../master/images/awsconfig_inventorytarget.png)

3. Click Setup Inventory to complete the action. Verify that the instance has collected an inventory of applications installed on the instance. 

![](../master/images/awsconfig_applicationinventory.png)

4. On the AWS Systems Manager console, choose Managed Instances, and then choose Edit AWS Config recording for the EC2 instance. It will talk you to AWS Config Console, under Settings.

![](../master/images/awsconfig_editconfig.png)

5. Under Settings, click **Turn on** button to enable the Configuration Recording.

![](../master/images/awsconfig_turnonrecording.png)

6. Let's install Java on one of these managed instances. Go to System Manager Console, Inventory.
7. Note one of the Instance ID from the managed instances list.
8. Go to Session Manager, and click **Start session**. Search and select the Instance ID from the previous step and click **Start Session**.
9. In the prompt, enter these follow command.

```bash
sudo yum install java-1.8.0-openjdk-devel
sudo alternatives --config java
```
10. Enter 2 to select JRE 1.8.  Confirm it by typing this command.

```bash
java -version
```
11. Wait for the next schedule but we can't. Let do it manually. Go to State Manager in System Manager console.
12. Under Associations, select the assosication for the Inventory created earlier then click **Apply association now**.
13. When it completes, in the resource tab, select the instance that we installed java 1.8.
14. Click Inventory tab, search for Name : Bgin with : j


![](../master/images/awsconfig_inventoryjava.png)

15. Go to Inventory and schroll down to the Corresponding managed instances. At the instance that we installed JRE 1.8, click the link to AWS Config. Examine the Configurtion timeline, the "Changes" on the latest one. It will take you to the detail what the changes were.

![](../master/images/awsconfig_inventorytimeline.png)

![](../master/images/awsconfig_javainstall.png)

16. Let's apply AWS Config rule to detect the prohibited or blacklisted applications. Go to AWS Config console and click Rules.
17. Click Add rule and search and select *ec2-managedinstance-applications-blacklisted*. Under Rule parameters, enter "java-1.7.0-openjdk' as the value for the applicationNames key as the application to be prohibited.

![](../master/images/awsconfig_applicationrule.png)

18. For remediation action, choose AWS-PublishSNSNotification and provide TopicArn and Message Value. You can use the same configuration as in Scenario I. Click **Save**. The rule will start to apply immediately. Wait until it complete and examine the result.

![](../master/images/awsconfig_appblacklistresult.png)

### Challenge
1. Fix the compliance error.
2. Use AWS Config Dashbord to monitor the compliance. Keep it Green!!

