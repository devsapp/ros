![图片alt](https://serverless-article-picture.oss-cn-hangzhou.aliyuncs.com/1640848491604_20211230071454223687.png)

通过该组件，快速通过 ROS 部署云资源

> 和函数计算结合的组合最佳实践请参考[最佳实践](./best-practice), 可以借力 IaC 平台服务实现其他云资源的部署，拓展 Serverless 应用资源的边界，也是 Serverless 应用一个很好的多环境实践。

- [测试](#测试)
- [完整配置](#完整配置)
  - [参数详情](#参数详情)
- [命令相关](#命令相关)
  - [Deploy 命令](#Deploy命令)
  - [Remove 命令](#Remove命令)

## 快速测试

1. 进入 examples 目录, 查看 `s.yaml` 示例

2. 可以通过`s deploy` 完成资源的 IaC 部署

```shell script
ros-test:
  RegionId:  cn-hangzhou
  StackName: test
  StackId:   3c71be88-e483-47da-b1d1-671dee2eead8
```

## 完整配置

```
edition: 3.0.0          #  命令行YAML规范版本，遵循语义化版本（Semantic Versioning）规范
name: rosApp            #  项目名称
access: aliyun-release  #  秘钥别名

resources:
  ros: #  服务名称
    component:  ros
    props:
        region: cn-hangzhou
        name: test
        template: ./template.json
        policy:
          url: url
          body: body
```

### 参数详情

| 参数名     | 必填  | 类型   | 参数描述                                                                                                             |
| ---------- | ----- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| region     | True  | Enum   | 地域                                                                                                                 |
| name       | True  | String | Stack 名字                                                                                                           |
| template   | False  | String | 和 terraform 参数 2 选 1, template 本地路径、线上地址或者原始的 ROS template，例如 http/https 协议的地址，或 oss 地址等，默认是`template.json`; 不传参数， 则表示线上存在这个 stack 则直接使用这个 stack 的 output，无需更新 stack |
| terraform   | False  | String | 和 template 参数 2 选 1, terraform 脚本本地所在的目录、 不传参数， 则表示线上存在这个 stack 则直接使用这个 stack 的 output，无需更新 stack |
| policy     | False | Struct | Policy 配置, 详情见 [CreateStack](https://help.aliyun.com/zh/ros/developer-reference/api-ros-2019-09-10-createstack) 中 StackPolicyBody 和  StackPolicyURL                                                                                                  |
| parameters | False | Struct | 模板中已定义的参数的名称和取值                                                                                       |

> 注: template 和 terraform 参数 2 选 1, 如果同时不传这个两个参数， 表示直接跟据 name 使用存量的 stack

#### Policy

| 参数名 | 必填  | 类型   | 参数描述                                                                                                                                                                                                                                                                          |
| ------ | ----- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| body   | False | String | 包含资源栈策略主体的结构，长度为 1~16,384 个字节。                                                                                                                                                                                                                                |
| url    | False | String | 包含资源栈策略的文件的位置。 URL 必须指向位于 Web 服务器（HTTP 或 HTTPS）或阿里云 OSS 存储桶（例如：oss://ros/stack-policy/demo、oss://ros/stack-policy/demo?RegionId=cn-hangzhou）中的策略，策略文件最大长度为 16,384 个字节。 如未指定 OSS 地域，默认与接口参数 RegionId 相同。 |

## 命令相关

- [Deploy 命令](#Deploy命令)
- [Remove 命令](#Remove命令)

### Deploy 命令

进行 ROS 项目部署

| 参数全称   | 参数缩写 | Yaml 模式下必填 | 参数含义                                                                                                                                                                                                                                                                                                                  |
| ---------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name       | -        | 选填            | Stack name                                                                                                                                                                                                                                                                                                                |
| assume-yes | y        | 选填            | 在交互时，默认选择`y`                                                                                                                                                                                                                                                                                                     |
| access     | a        | 选填            | 本次请求使用的密钥，可以使用通过[config 命令](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md#config-add-命令) 配置的密钥信息，以及[配置到环境变量的密钥信息](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md#通过环境变量配置密钥信息) |
| debug      | -        | 选填            | 打开`debug`模式，将会输出更多日志信息                                                                                                                                                                                                                                                                                     |
| help       | h        | 选填            | 查看帮助信息                                                                                                                                                                                                                                                                                                              |

### Remove 命令

移除指的 ROS 项目部署

| 参数全称   | 参数缩写 | Yaml 模式下必填 | 参数含义                                                                                                                                                                                                                                                                                                                  |
| ---------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name       | -        | 选填            | Stack name                                                                                                                                                                                                                                                                                                                |
| assume-yes | y        | 选填            | 在交互时，默认选择`y`                                                                                                                                                                                                                                                                                                     |
| access     | a        | 选填            | 本次请求使用的密钥，可以使用通过[config 命令](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md#config-add-命令) 配置的密钥信息，以及[配置到环境变量的密钥信息](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md#通过环境变量配置密钥信息) |
| debug      | -        | 选填            | 打开`debug`模式，将会输出更多日志信息                                                                                                                                                                                                                                                                                     |
| help       | h        | 选填            | 查看帮助信息                                                                                                                                                                                                                                                                                                              |
### Info 命令

显示 ROS Stack 信息

| 参数全称   | 参数缩写 | Yaml 模式下必填 | 参数含义                                                                                                                                                                                                                                                                                                                  |
| ---------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name       | -        | 选填            | Stack name                                                                                                                                                                                                                                        
| access     | a        | 选填            | 本次请求使用的密钥，可以使用通过[config 命令](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md#config-add-命令) 配置的密钥信息，以及[配置到环境变量的密钥信息](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md#通过环境变量配置密钥信息) |
| debug      | -        | 选填            | 打开`debug`模式，将会输出更多日志信息                                                                                                                                                                                                                                                                                     |
| help       | h        | 选填            | 查看帮助信息                               