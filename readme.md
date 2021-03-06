![图片alt](https://serverless-article-picture.oss-cn-hangzhou.aliyuncs.com/1640848491604_20211230071454223687.png)

通过该组件，快速通过 ROS 部署项目

- [测试](#测试)
- [完整配置](#完整配置)
    - [参数详情](#参数详情)
- [命令相关](#命令相关)
    - [Deploy命令](#Deploy命令)
    - [Remove命令](#Remove命令)

## 测试

1. 在本地创建`s.yaml`

```yaml
edition: 1.0.0          #  命令行YAML规范版本，遵循语义化版本（Semantic Versioning）规范
name: rosApp            #  项目名称
access: default  #  秘钥别名

services:
  ros: #  服务名称
    component:  ros
    props:
      region: cn-hangzhou
      name: test
      template: ./template.json
      parameters:
        test: 1
        demo: 2
```

2. 创建一个符合ROS规范的json文件`template.json`

```json
{
  "ROSTemplateFormatVersion": "2015-09-01"
}
```

3. 可以通过`s deploy`快速进行部署：

```shell script
ros-test: 
  RegionId:  cn-hangzhou
  StackName: test
  StackId:   3c71be88-e483-47da-b1d1-671dee2eead8
```

## 完整配置

```
edition: 1.0.0          #  命令行YAML规范版本，遵循语义化版本（Semantic Versioning）规范
name: rosApp            #  项目名称
access: aliyun-release  #  秘钥别名

services:
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

| 参数名 |  必填  |  类型  | 参数描述                                                            |
| --- |  ---  |  ---  |-----------------------------------------------------------------|
| region | True | Enum | 地域                                                              |
| name | True | String | Stack 名字                                                        |
| template | True | String | Template 本地路径或线上地址，例如http/https协议的地址，或oss地址等，默认是`template.json` |
| policy | False | Struct | Policy 配置                                                       |
| parameters | False | Struct | 模板中已定义的参数的名称和取值                                                 |

#### Policy
| 参数名 |  必填  |  类型  |  参数描述  |
| --- |  ---  |  ---  |  ---  |
| body | False | String | 包含资源栈策略主体的结构，长度为1~16,384个字节。 |
| url | False | String | 包含资源栈策略的文件的位置。 URL必须指向位于Web服务器（HTTP或HTTPS）或阿里云OSS存储桶（例如：oss://ros/stack-policy/demo、oss://ros/stack-policy/demo?RegionId=cn-hangzhou）中的策略，策略文件最大长度为16,384个字节。 如未指定OSS地域，默认与接口参数RegionId相同。 |

## 命令相关

- [Deploy命令](#Deploy命令)
- [Remove命令](#Remove命令)

### Deploy命令

进行ROS项目部署

| 参数全称   | 参数缩写 | Yaml模式下必填 | 参数含义                                                     |
| ---------- | -------- | -------------- | ------------------------------------------------------------ |
| name       | -        | 选填           | Stack name                           |
| assume-yes | y        | 选填           | 在交互时，默认选择`y`                                        |
| access     | a        | 选填           | 本次请求使用的密钥，可以使用通过[config命令](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md#config-add-命令) 配置的密钥信息，以及[配置到环境变量的密钥信息](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md#通过环境变量配置密钥信息) |
| debug      | -        | 选填           | 打开`debug`模式，将会输出更多日志信息                        |
| help       | h        | 选填           | 查看帮助信息                                                 |

### Remove命令

移除指的ROS项目部署

| 参数全称   | 参数缩写 | Yaml模式下必填 | 参数含义                                                     |
| ---------- | -------- | -------------- | ------------------------------------------------------------ |
| name       | -        | 选填           | Stack name                           |
| assume-yes | y        | 选填           | 在交互时，默认选择`y`                                        |
| access     | a        | 选填           | 本次请求使用的密钥，可以使用通过[config命令](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md#config-add-命令) 配置的密钥信息，以及[配置到环境变量的密钥信息](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md#通过环境变量配置密钥信息) |
| debug      | -        | 选填           | 打开`debug`模式，将会输出更多日志信息                        |
| help       | h        | 选填           | 查看帮助信息                                                 |
