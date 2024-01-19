## 简介

假设我想开发一个 oss png 图片触发函数， 函数处理完毕后， 并将一些处理信息保存回表格存储进行持久化， 如下图所示

![](https://img.alicdn.com/imgextra/i4/O1CN01FGYh0O1BzpZiqUkPc_!!6000000000017-0-tps-1434-272.jpg)

我的应用名字为 xl-app，为了做环境的区分， 设置了：

```yaml
vars:
  stack-name: xl-app-${env('DEV_ENV')}
```

同时依赖的相关资源命名和 stack 建立关系：

> 阿里云很多云资源名字是全局唯一，比如 oss bucket name 和 ots instance name

```yaml
parameters:
  BucketName: ${vars.stack-name}
  InstanceName: ${vars.stack-name}
  TableName: xl-app
```

依赖 ROS 自动新建：

- OSS bucket
- 表格存储的实例和表格

我们支持 3 种模式，依赖的后端服务都是 ROS

对于用户的 infra, 可以是：

- ROS YAML 模版语法

- terraform 语法

- 原生的 s.yaml 语法， 支持的云服务有限, 目前支持的云资源如下: [aliyun-resources](https://code.alibaba-inc.com/serverless-devs/aliyun-resources)

## 部署

以 ros 原生模版为例， 进入 ros 目录

> 同理，如果是 terraform 可以进入 terraform 目录

### 部署到 testing 环境

```shell
$ DEV_ENV=testing  s deploy -y
[2023-06-09 12:20:19] [INFO] [S-CORE] - It is detected that your project has the following projects < env-res,func1 > to be execute
[2023-06-09 12:20:19] [INFO] [S-CORE] - Start executing project env-res
[2023-06-09 12:20:20] [INFO] [ROS] - create stack stackName = xl-app-testing...
[2023-06-09 12:20:22] [INFO] [ROS] - ALIYUN::ROS::Stack  xl-app-testing   CREATE_IN_PROGRESS  Stack CREATE started   2023/6/9 12:20:22
[2023-06-09 12:20:22] [INFO] [ROS] - ALIYUN::OSS::Bucket  Bucket-001   CREATE_IN_PROGRESS  state changed   2023/6/9 12:20:22
[2023-06-09 12:20:25] [INFO] [ROS] - ALIYUN::OTS::Instance  Instance-001   CREATE_IN_PROGRESS  state changed   2023/6/9 12:20:23
[2023-06-09 12:20:29] [INFO] [ROS] - ALIYUN::OTS::Table  Table-001   CREATE_IN_PROGRESS  state changed   2023/6/9 12:20:27
[2023-06-09 12:20:29] [INFO] [ROS] - ALIYUN::OTS::Instance  Instance-001   CREATE_COMPLETE  state changed   2023/6/9 12:20:27
[2023-06-09 12:20:29] [INFO] [ROS] - ALIYUN::OSS::Bucket  Bucket-001   CREATE_COMPLETE  state changed   2023/6/9 12:20:27
[2023-06-09 12:20:51] [INFO] [ROS] - ALIYUN::RAM::Role  Role-001   CREATE_IN_PROGRESS  state changed   2023/6/9 12:20:50
[2023-06-09 12:20:51] [INFO] [ROS] - ALIYUN::OTS::Table  Table-001   CREATE_COMPLETE  state changed   2023/6/9 12:20:50
[2023-06-09 12:20:55] [INFO] [ROS] - ALIYUN::RAM::AttachPolicyToRole  AttachPolicyToRole-001   CREATE_IN_PROGRESS  state changed   2023/6/9 12:20:53
[2023-06-09 12:20:55] [INFO] [ROS] - ALIYUN::RAM::Role  Role-001   CREATE_COMPLETE  state changed   2023/6/9 12:20:53
[2023-06-09 12:20:55] [INFO] [ROS] - stack xl-app-testing create finished! stackId = f58712fe-ac72-496d-85fd-d747770278e7
[2023-06-09 12:20:56] [INFO] [S-CORE] - Project env-res successfully to execute

[2023-06-09 12:20:56] [INFO] [S-CORE] - Start executing project func1
✔ Checking Service, Function, Triggers (1.26s)
...

[2023-06-09 12:21:32] [INFO] [S-CORE] - Project func1 successfully to execute

env-res:
  TableName:    xl_app
  InstanceName: xl-app-testing
  BucketName:   xl-app-testing
  RoleArn:      acs:ram::1702981446385561:role/xl-app-testing
func1:
  region:   cn-beijing
  service:
    name: xl-app-testing
  function:
    name:       func1
    runtime:    python3.9
    handler:    index.handler
    memorySize: 128
    timeout:    60
  triggers:
    -
      type: oss
      name: ossTrigger

```

如果您的 ros yaml 文件没有变化，也可以很快给您返回不会无变更信息，output 还是可以正常输出

![](https://img.alicdn.com/imgextra/i3/O1CN01w7QURB1tlUGqNkmQw_!!6000000005942-2-tps-1766-554.png)

### 部署到 staging 环境

改变一个 env 即可

```shell
$ DEV_ENV=staging s deploy -y
```

## 使用存量的 stack 或者 stack 导入存量的阿里云资源如何处理呢？

将 stack 的 template（或者 terraform） 以及 parameters 等参数删除或者注释掉

![](https://img.alicdn.com/imgextra/i2/O1CN01dBE0pT1RzP8DYBTJF_!!6000000002182-0-tps-1236-544.jpg)

这个时候，S 工具不会对 stack 进行更新了， 只会对存量 stack 进行读取，使用其 output 作为函数的环境变量等配置

```shell
$ DEV_ENV=testing s deploy
⌛  Steps for [deploy] of [hello-world-app]
====================
[2024-01-05 12:26:03][INFO][env-res] You did not provide the 'template' parameter. Using the existing stack xl-app-testing in region cn-hangzhou
[2024-01-05 12:26:04][INFO][env-res] stack detail ==>
https://ros.console.aliyun.com/cn-hangzhou/stacks/e3be1078-e3a5-4676-9f39-cd527b3729bd?resourceGroupId=

···
```

然后，您可以使用提示中的 ROS 控制台白屏化管理更新您的 stack, [ROS 资源导入](https://www.alibabacloud.com/help/zh/ros/user-guide/overview-6)

## 补充

ROS 支持原生的 terraform 部署, 工具已经做好的转换处理, 只需要将 infra 所有的 .tf 文件的名字和内容处理成如下图样式即可

![](https://img.alicdn.com/imgextra/i4/O1CN019yPeue23oMzC6idd9_!!6000000007302-0-tps-1592-1548.jpg)
