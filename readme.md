# 前言

通过该组件，快速通过 ROS 部署项目

# 测试

template.yaml

```
edition: 1.0.0          #  命令行YAML规范版本，遵循语义化版本（Semantic Versioning）规范
name: rosApp            #  项目名称
access: aliyun-release  #  秘钥别名

services:
  ros-test: #  服务名称
    component:  ros
    props:
      region: cn-hangzhou
      name: test
      template: ./template.json
```

temp.json

```
{
  "ROSTemplateFormatVersion": "2015-09-01"
}
```

# 完整配置

```
edition: 1.0.0          #  命令行YAML规范版本，遵循语义化版本（Semantic Versioning）规范
name: rosApp            #  项目名称
access: aliyun-release  #  秘钥别名

services:
  ros-test: #  服务名称
    component:  ros
    props:
        region: cn-hangzhou
        name: test
        template: ./temp.json
        policy:
          url: url
          body: body
```

# 参数详情

| 参数名 |  必填  |  类型  |  参数描述  |
| --- |  ---  |  ---  |  ---  |
| region | True | Enum | 地域 |
| name | True | String | Stack 名字 |
| template | True | String | Template 本地路径 |
| policy | False | Struct | Policy 配置 |

## Policy
| 参数名 |  必填  |  类型  |  参数描述  |
| --- |  ---  |  ---  |  ---  |
| body | False | String | 包含资源栈策略主体的结构，长度为1~16,384个字节。 |
| url | False | String | 包含资源栈策略的文件的位置。 URL必须指向位于Web服务器（HTTP或HTTPS）或阿里云OSS存储桶（例如：oss://ros/stack-policy/demo、oss://ros/stack-policy/demo?RegionId=cn-hangzhou）中的策略，策略文件最大长度为16,384个字节。 如未指定OSS地域，默认与接口参数RegionId相同。 |

