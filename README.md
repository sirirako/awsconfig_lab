# GRC334 - Build an effective security compliance program that continuously evaluates and remediates your security posture
In this session learn how to build a solution that will continuously evaluate your AWS resources for security compliance using AWS Config Rules, Amazon CloudWatch Events, and AWS Lambda. You will also learn how to improve your security posture by correcting or eliminating non-compliant resources.

## Prerequisites
* AWS Account
* IAM Account with Full Access


## Instruction
### Log in to AWS account and run Cloud Formation template
> In this section, we will create AWS resources uses for this session
> Cloud Formation is 
1. Go to CloudFormation Console, and click Create stack. For **Prerequisite - Preapare template**, select *Template is ready*.
2. Download the template from here to your machine.
3. Under Specify template, select *Upload a template file* and click *Choose file* button and select the Cloud Formation template downloaded from the previous step.


### Set up AWS Config rules
#### Prohibit S3 Public Read access 
> **s3-bucket-public-read-prohibited** Checks that your Amazon S3 buckets do not allow public read access. The rule checks the Block Public Access settings, the bucket policy, and the bucket access control list (ACL).
1. Go to AWS Config Console and click *Rule* from the left menu
2. Click *+ Add Rule*, search and select s3-bucket-public-read-prohibited. Leave everything with default value in **Trigger** section.
3. In **Choose remediation action** section, select AWS-PubishSNSNotification and provide SNS TopicArn and Message
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




#### Black list application in EC2




### Using System Manager, Inventory for Compliance.

1. Create Managed Instances
2. Go to Inventory
3. Use Session Manager to access the console and install a software
4. 
