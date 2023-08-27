---
title: VPC EC2-Node-server-AWS-SES
description: Launch an EC2 in a public subnet and host a web-server
author: Emmanuel Ememe
publishedDate: 27/08/2023
date: 2023-08-27
---

## Introduction

- Create a vpc
- Create an ec2 in a public subnet
- Run a web-server in the ec2 port 80 and userdata
- Session Manager

## CDK Stack

create a vpc

```tsx
const vpc = new aws_ec2.Vpc(this, "VpcDemo", {
      vpcName: "VpcDemo",
      maxAzs: 1,
      cidr: props.cidr,
      subnetConfiguration: [
        {
          name: "PublicSubnet",
          cidrMask: 24,
          subnetType: aws_ec2.SubnetType.PUBLIC,
        },
        {
          name: "PrivateSubnet",
          cidrMask: 24,
          subnetType: aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: "IsolatedSubnet",
          cidrMask: 24,
          subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
```

add vpc endpoints

```tsx
// add s3 interface endpoint
vpc.addGatewayEndpoint("S3VpcEndpoint", {
  service: aws_ec2.GatewayVpcEndpointAwsService.S3,
});

// add vpc endpoint ssm
vpc.addInterfaceEndpoint("VpcInterfaceEndpointSSM", {
  service: aws_ec2.InterfaceVpcEndpointAwsService.SSM,
});
```

create a security group

```tsx
const sg = new aws_ec2.SecurityGroup(this, "SecurityGroupForPubEc2", {
  vpc: props.vpc,
  securityGroupName: "SGForPubEc2",
  description: "Allow 80",
  allowAllOutbound: true,
});

sg.addIngressRule(
  aws_ec2.Peer.anyIpv4(),
  aws_ec2.Port.tcp(80),
  "allow port 80 http"
);
```

create a role for the ec2

```tsx
// role for ec2
const role = new aws_iam.Role(this, "RoleForPubEc2", {
  roleName: "RoleForPubEc2",
  assumedBy: new aws_iam.ServicePrincipal("ec2.amazonaws.com"),
});

role.addToPolicy(
  new aws_iam.PolicyStatement({
    effect: Effect.ALLOW,
    resources: ["*"],
    actions: ["s3:*"],
  })
);

role.addManagedPolicy(
  aws_iam.ManagedPolicy.fromManagedPolicyArn(
    this,
    "PolicySSMMangerAccessS3",
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  )
);
```

create an ec2 in a public subnet

```tsx
const publicEc2 = new aws_ec2.Instance(this, "PubEc2Instance", {
  vpc: props.vpc,
  role: role,
  instanceName: "PubEc2Instance",
  instanceType: aws_ec2.InstanceType.of(
    aws_ec2.InstanceClass.T3,
    aws_ec2.InstanceSize.MICRO
  ),
  machineImage: new aws_ec2.AmazonLinuxImage({
    generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    edition: aws_ec2.AmazonLinuxEdition.STANDARD,
  }),
  securityGroup: sg,
  vpcSubnets: {
    subnetType: aws_ec2.SubnetType.PUBLIC,
  },
  allowAllOutbound: true,
});
```

add user data from commands

```tsx
let command = `export USER_NAME=${name} \n`;
let text = fs.readFileSync("./lib/user-data.sh", "utf8");
ec2.addUserData(command.concat(text));
```

add user data from file

```tsx
publicEc2.addUserData(fs.readFileSync("./lib/user-data.sh", "utf8"));
```

## User Data

userdata-1 a simple web using flask

```
cd ~
wget https://github.com/cdk-entest/vpc-sg-ec2-demo/archive/refs/heads/main.zip
unzip main.zip
cd vpc-sg-ec2-demo-main
cd web
python3 -m pip install --user -r requirements.txt
python3 -m app
```

userdata -2 a simple web using flask and access to S3 and Polly to convert text to speech

```
#!/bin/bash
cd ~
wget https://github.com/cdk-entest/flask-tailwind-polly/archive/refs/heads/master.zip
unzip master.zip
cd flask-tailwind-polly-master
python3 -m ensurepip --upgrade
python3 -m pip install -r requirements.txt
cd app
export BUCKET_NAME=""
python3 -m app
```

## Multiple EC2

using a loop to create multiple EC2 instances

```tsx
props.instanceNames.map((name) => {
  let ec2 = new aws_ec2.Instance(this, name, {
    vpc: vpc,
    vpcSubnets: {
      subnetType: aws_ec2.SubnetType.PUBLIC,
    },
    role: role,
    securityGroup: sg,
    instanceName: name,
    instanceType: aws_ec2.InstanceType.of(
      aws_ec2.InstanceClass.T3,
      aws_ec2.InstanceSize.MICRO
    ),
    machineImage: new aws_ec2.AmazonLinuxImage({
      generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      edition: aws_ec2.AmazonLinuxEdition.STANDARD,
    }),
  });

  // userdata text
  let command = `export USER_NAME=${name} \n`;
  let text = fs.readFileSync("./lib/user-data.sh", "utf8");
  // add user data
  ec2.addUserData(command.concat(text));
});
```

## Basic Vim

create a vimrc file at

```bash
vim ~/.vim/vimrc
```

add very basic configuration for vim

```tsx
" tab width
set tabstop=2
set shiftwidth=2
set softtabstop=2
set expandtab
set cindent
set autoindent
set smartindent
set mouse=a
set hlsearch
set showcmd
set title
set expandtab
set incsearch

" line number
set number
hi CursorLineNr cterm=None

" highlight current line
set cursorline
hi CursorLine cterm=NONE ctermbg=23  guibg=Grey40

" change cursor between modes
let &t_SI = "\e[6 q"
let &t_EI = "\e[2 q"

" netrw wsize
let g:netrw_liststyle=3
let g:netrw_keepdir=0
let g:netrw_winsize=30
map <C-a> : Lexplore<CR>

" per default, netrw leaves unmodified buffers open.  This autocommand
" deletes netrw's buffer once it's hidden (using ':q;, for example)
autocmd FileType netrw setl bufhidden=delete  " or use :qa!

" these next three lines are for the fuzzy search:
set nocompatible      "Limit search to your project
set path+=**          "Search all subdirectories and recursively
set wildmenu          "Shows multiple matches on one line

" highlight syntax
set re=0
syntax on
```

## Session Manager

- Connect to EC2 via Session Manager
- EC2 instance profile assume IAM role

![vpc-ec2-ssm-role](https://github.com/cdk-entest/vpc-sg-ec2-demo/assets/20411077/2864c841-7311-4c65-9f9f-0d259df5cd47)

## SSH Configuration

```bash
sudo passwd ec2-user
```

the enable ssh password in sshd_config file

```bash
sudo vim /etc/ssh/sshd_config
```

edit

```text
PasswordAuthentication yes
```

and optionally

```text
PermitRootLogin yes
```

finally need to reset ssh service

```bash
sudo sshd restart
```

## Remote Desktop Connect Window

Install microsoft remote desktop (app for mac).

Then download the RDP file from aws console

<img width="861" alt="Screen Shot 2022-11-29 at 09 01 47" src="https://user-images.githubusercontent.com/20411077/204420717-59ee0ecf-b64b-4e93-97c9-f7195a5abf54.png">

Retrieve the window password by uploading the key pair

<img width="861" alt="Screen Shot 2022-11-29 at 09 01 57" src="https://user-images.githubusercontent.com/20411077/204420769-f346e3b4-80f2-454d-8336-2afa8fbdf2d8.png">

## Troubleshooting

- Place EC2 in a public subnet with allocated IP address
- Security Group open port 80, 22, 3389
- Role enable SSM

## Reference

- [system manager and session manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html)

- [session manager requirements](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-prerequisites.html)

When we’re deploying our AWS CDK stacks we have a few options available to us, the easiest and where most people start is deploying them via the terminal on your local machine with a command like `cdk deploy`. For development, this method is more than adequate as it allows quick and easy deployment but for staging and production environments we should avoid deploying from our local terminal and instead use a CI environment like GitHub Actions.

There are many reasons for this but some of the more important ones are.

Distributing keys and secrets with access to production to multiple developers and allowing access from local machines isn’t good for security
Deployment to production should happen from a single source that is controlled and maintained to ensure there aren’t accidental differences and regressions.
So, in this post, I’m going to walk through how we can configure GitHub Actions to deploy an AWS stack for us.

Configuring IAM
To get started with deploying a CDK stack from GitHub Actions we first need to create a new IAM user using a custom policy. To do this head over to IAM in your AWS Dashboard and then click on “Policies” on the left-hand sidebar, followed by “Create Policy” and then switch to the JSON editor and paste in the below policy statement.

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["sts:AssumeRole"],
      "Resource": ["arn:aws:iam::*:role/cdk-*"]
    }
  ]
}
Then click on the “Next” button a couple of times before naming your new policy “CDK_Deploy” and creating it. This custom IAM policy will allow the user deploying our CDK stack to assume the roles needed to deploy the stack successfully.

Now, we’ve created the policy needed to deploy our CDK stack, let’s create a new IAM User Group to attach the user and policy to. (You could skip this step and attach the policy directly to the user but the best practice is to attach policies to a group and add users to that group).

To create a new group head over to “User groups” on the left-hand sidebar, then click on “Create Group”. Name your group “CDK-Deploy” and then attach the policy that we created a moment ago before clicking “Create group” to finish the group creation process.

Finally with our policy and group created we can now create our new IAM user so go to the Users page by clicking on “Users” on the left-hand sidebar and then “Add Users”, name your new user “cdk-deploy” and then press “next” followed by selecting the group you just created. Then push “next” again to review the options you’ve selected before clicking “Create user” to finish the process.

With our new user created, the last step we need to perform in AWS is to create a new access key for the user so we can authenticate with AWS when running our GitHub Action. To create a new access key for our user, click on the username we just created from the “Users” page.

Then when inside the user's settings page, click on “Security credentials” and then “Create access key”; you’ll then want to select the “Command Line Interface (CLI)” option for the use case the keys will be used for. Then tick the “I understand…” statement before pressing “Next”; you can then add an optional description before pressing “Create access key”. Make sure to copy both the “Access key” and Secret access key” that is displayed to you as this is the only time the secret key is shown.

With the keys generated and copied, all of the AWS steps for this tutorial are complete and we’re ready to head over to GitHub and create our GitHub Action.

Configuring our GitHub Action
The first thing you’ll want to do inside the GitHub repository with the CDK stack you’d like to deploy; is create two GitHub Action secrets. To do this, head over to the “Settings” page for your repository and then click on “Secrets and variables” under “Security” and then “Actions”. Now you’ll want to create two secrets, one called `AWS_ACCESS_KEY_ID` with the value being the access key you got from AWS and then a second called `AWS_SECRET_KEY` with the value being the secret key you copied from AWS.

With the secrets and settings all configured, we can now write our GitHub Action so if you don’t already have the folders in your project, create a `.github` folder in the root of your repository with a `workflows` folder inside that. Then create a new file called `cdk-deploy.yml` and paste into it the below code.

name: CDK Deploy

on:
  push:
    branches: ["main"]

jobs:
  aws_cdk:
    runs-on: ubuntu-latest
    steps:
      - name: Check out code
        uses: actions/checkout@v2
        with:
          fetch-depth: 2

      - name: Setup Node.js environment
        uses: actions/setup-node@v2
        with:
          node-version: 16
          cache: "npm"

      - name: Install dependencies
        run: npm install

      - name: Install AWS CDK
        run: npm i -g aws-cdk

      - name: Configure aws credentials
        uses: aws-actions/configure-aws-credentials@master
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_KEY }}
          aws-region: "YOUR_AWS_REGION"

      - name: Synth stack
        run: cdk synth

      - name: Deploy stack
        run: cdk deploy --all --require-approval never
In this workflow, we install the AWS CDK along with the dependencies of our repository before using the `[aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)` action to configure our AWS credentials and region using the secrets we just created.

Note: make sure to update `“YOUR_AWS_REGION”` to the AWS region you’d like to deploy to such as `"eu-west-1"`

We then run `cdk synth` to make sure the stack synthesizes correctly before then running `cdk deploy --all --require-approval never` to deploy all of the stacks defined in our repository while also skipping any approval requests as we won’t be able to input any approval on the CI environment.

With our GitHub Action written, commit the new workflow file and then push it to GitHub and watch your new CDK stack deployment workflow run for the first time where your CDK stack will hopefully be deployed using the new IAM user you created!

Closing Thoughts
With the push of our new workflow, we’ve come to the end of the tutorial. In this post, we’ve covered everything you need to know when it comes to deploying an AWS CDK stack using GitHub Actions. We’ve created a new IAM policy, group, and user and then generated keys for that user to allow GitHub to authenticate with AWS and deploy our CDK stack using a GitHub Action.

I hope you found this tutorial helpful and if you have any questions, feel free to reach out and ask me, I’ll be more than happy to help.

And, until next time, thank you for reading!