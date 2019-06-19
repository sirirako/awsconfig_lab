import boto3
from botocore.exceptions import ClientError
import json
import os
import logging

ACL_RD_WARNING = "The S3 bucket ACL allows public read access."
PLCY_RD_WARNING = "The S3 bucket policy allows public read access."
ACL_WRT_WARNING = "The S3 bucket ACL allows public write access."
PLCY_WRT_WARNING = "The S3 bucket policy allows public write access."
RD_COMBO_WARNING = ACL_RD_WARNING + PLCY_RD_WARNING
WRT_COMBO_WARNING = ACL_WRT_WARNING + PLCY_WRT_WARNING



def lambda_handler(event, context):
    # instantiate Amazon S3 client
    s3 = boto3.client('s3')
    resource = list(event['detail']['requestParameters']['evaluations'])[0]
    bucketName = resource['complianceResourceId']
    s3.put_public_access_block(
        Bucket=bucketName,
        PublicAccessBlockConfiguration={
            'BlockPublicAcls': True,
            'IgnorePublicAcls': True,
            'BlockPublicPolicy': True,
            'RestrictPublicBuckets': True
        }
    )
    #complianceFailureAnnotation = resource['annotation']
    #complianceFailure = event['detail']['requestParameters']['evaluations'][0]['annotation']
    #if(complianceFailureAnnotation == ACL_RD_WARNING or complianceFailureAnnotation == ACL_WRT_WARNING or complianceFailureAnnotation == 'The S3 bucket policy allows public write access.'):
    #s3.put_bucket_acl(Bucket = bucketName, ACL = 'private')
    #elif(complianceFailureAnnotation == RD_COMBO_WARNING or complianceFailureAnnotation == WRT_COMBO_WARNING):
        #s3.put_bucket_acl(Bucket = bucketName, ACL = 'private')
        #policyNotifier(bucketName, s3)
    return 0  # done