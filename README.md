# UCloud UFile JavaScript SDK

JavaScript SDK for [UCloud UFile（对象存储服务）]()

## 目录
#### &sect; [说明](#intro)
#### &sect; [安装](#install)
#### &sect; [示例](#examples)
#### &sect; [API列表](#api)
##### &raquo; [获取文件列表（getFileList）](#getFileList)
##### &raquo; [查询文件信息（getFileDetail）](#getFileDetail)
##### &raquo; [下载文件（downloadFile）](#downloadFile)
##### &raquo; [删除文件（deleteFile）](#deleteFile)
##### &raquo; [批量删除（batchDelete）](#batchDelete)
##### &raquo; [普通上传（uploadFile）](#uploadFile)
##### &raquo; [表单上传（formUpload）](#formUpload)
##### &raquo; [分片上传（sliceUpload）](#sliceUpload)
##### &raquo; [秒传文件（hitUpload）](#hitUpload)
##### &raquo; [批量上传（batchUpload）](#batchUpload)

## <a name="intro">&sect; 说明</a>

- Ufile JsSDK 主要用来从页面上传、下载、列表、删除文件。
- SDK需要配合服务端 token_server.php 结合使用。先配置好环境，安装web服务器和解析php的服务。  
- 部署SDK到服务器，配置好[安装](#install)中指定的4个参数，访问服务器地址，即可操作[示例](#examples)中的功能。
- V2的示例支持SDK内部签名计算、服务端签名计算和上传回调。V1不再维护，以V2为准。

- 上传文件大致使用流程：
- 1、参考V2/demo
- 2、需要一个后端服务器，提供 token 生成的功能，类似 token_server.php; 在上传文件时，需要调用这个 php，实现 签名的生成
- 3、调用方法，具体参考 v2/demo 的代码。
- 4、具体流程： 
-      a、js 初始化一个 UCloudUfile 对象，传入bucket 的参数，和 token server .php 的地址
-      b、token_server.php ， 部署在用户自己的服务器上，主要是用来生成签名。
-         里面需要用户填入公私钥信息， 需要修改代码，按自己业务需求，对请求做自己业务的鉴权校验；
-         放在服务器的目的，主要是防止公私钥泄露，又能提供上传的签名服务。
-      c、js 调用 uploadFile 接口完成上传文件（uploadFile  里面，会去请求 token_server.php, 然后把数据传到 ucloud 的服务器）

## <a name="install">&sect; 安装</a>

> SDK需要浏览器支持HTML5。  
> 将src目录中的spark-md5-3.0.0.min.js和ufile.js引入到您的项目中，如下所示。

```
<script type="text/javascript" src="sdk/spark-md5-3.0.0.min.js"></script>
<script type="text/javascript" src="sdk/ufile.js"></script>
``` 

> 配置`bucketName`和`bucketUrl`。  
> 既可以在实例化时传参设置，也可以在src目录的ufile.js中全局设置。  

> 配置`UCLOUD_PUBLIC_KEY`和`UCLOUD_PRIVATE_KEY`。  
> 在token_server.php中设置。   
> 在[UCloud控制台](https://console.ucloud.cn/apikey)中可以查看您的API密钥的`public_key`和`private_key`。

> 如果浏览器控制台出现类似下面所示的错误提示：

```
XMLHttpRequest cannot load https://example-name.cn-bj.ufileos.com/?list&prefix=&marker=&limit=20. 
Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header contains the invalid value 'null'.
Origin 'http://localhost:8081' is therefore not allowed access.
```

> 则说明你的bucket地址（https://example-name.cn-bj.ufileos.com/）没有跨域设置，需要提交工单。

## <a name="examples">&sect; 示例</a>

- 获取文件列表
- 查询文件信息
- 下载文件
- 删除文件 
- 批量删除 
- 普通上传
- 表单上传
- 分片上传
- 秒传文件
- 批量上传

参见SDK中examples目录中的示例。  
目录中的jQuery和Bootstrap不是必须引入，只是为了方便演示。  
    
## <a name="api">&sect; API</a>

### <a name="getFileList">&raquo; 获取文件列表（getFileList）</a>

#### 接口功能

> 获取Bucket的文件列表

#### 请求参数

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|success |false |function |请求成功的回调函数 |
|error |false |function |请求失败的回调函数 |

#### 返回参数

|名称|类型|说明 |
|:----- |:------|:----------------------------- |
|BucketId |string |对象存储空间ID |
|BucketName |string |对象存储空间名称 |
|DataSet |array |文件信息列表 |
|NextMarker |string |下一个标志字符串 |

#### DataSet

|名称|类型|说明 |
|:----- |:------|:----------------------------- |
|BucketName |string |对象存储空间名称 |
|CreateTime |number |文件创建时间 |
|FileName |string |文件名称 |
|Hash |string |文件ETag |
|MimeType |string |文件类型 |
|ModifyTime |number |文件修改时间 |
|Size |number |文件大小 |

#### 调用示例

```
ufile.getFileList(successCallBack, errorCallBack);
```

### <a name="getFileDetail">&raquo; 查看文件信息（getFileDetail）</a>

#### 接口功能

> 查询文件基本信息

#### 请求参数

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|fileName |true |string |请求查询的文件名称 |
|success |false |function |请求成功的回调函数 |
|error |false |function |请求失败的回调函数 |

#### 返回参数

|名称|类型|说明 |
|:----- |:------|:----------------------------- |
|contentType |string |文件类型 |
|eTag |string |文件eTag |
|status |string |返回的HTTP状态码。查询成功是200，失败是404 |
|response |string |API返回的response |

#### 调用示例

```
ufile.getFileDetail(fileName, successCallBack, errorCallBack);
```

### <a name="downloadFile">&raquo; 下载文件（downloadFile）</a>

#### 接口功能

> 下载文件

#### 请求参数

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|fileName |true |string |请求下载的文件名称 |
|success |false |function |请求成功的回调函数 |
|error |false |function |请求失败的回调函数 |
|progress |false |function |请求下载进度的回调函数 |

#### success返回

|名称|类型|说明 |
|:----- |:------|:----------------------------- |
|response |Blob。具体参见[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob) |API返回的response |

#### response

|名称|类型|说明 |
|:----- |:------|:----------------------------- |
|size |number |文件大小 |
|type |string |文件类型 |

#### progress返回

|名称|类型|说明 |
|:----- |:------|:----------------------------- |
|response |number |下载进度比例。已完成上传文件大小/总上传文件大小的值，位于0-1之间。 |

#### 调用示例

```
ufile.downloadFile(fileName, successCallBack, errorCallBack, progressCallBack);
```

### <a name="deleteFile">&raquo; 删除文件（deleteFile）</a>

#### 接口功能

> 删除文件

#### 请求参数

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|fileName |true |string |请求删除的文件名称 |
|success |false |function |请求成功的回调函数 |
|error |false |function |请求失败的回调函数 |

#### 调用示例

```
ufile.deleteFile(fileName, successCallBack, errorCallBack);
```

### <a name="batchDelete">&raquo; 批量删除（batchDelete）</a>

#### 接口功能

> 批量删除

#### 请求参数

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|fileList |true |array |请求删除的文件名称组成的数组 |
|success |false |function |请求成功的回调函数 |
|error |false |function |请求失败的回调函数 |

#### 调用示例

```
ufile.batchDelete(fileList, successCallBack, errorCallBack);
```

### <a name="uploadFile">&raquo; 普通上传（uploadFile）</a>

#### 接口功能

> 普通上传文件

#### 请求参数

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|data |true |object |请求上传的参数 |
|success |false |function |请求成功的回调函数 |
|error |false |function |请求失败的回调函数 |
|progress |false |function |上传进度的回调函数 |

#### data

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|file |true |File。具体参见[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/File) |请求上传的文件|
|fileRename |false |string |文件的重新命名 |

#### progress返回

|名称|类型|说明 |
|:----- |:------|:----------------------------- |
|response |number |上传进度比例。已完成上传文件大小/总上传文件大小的值，位于0-1之间。 |

#### 调用示例

```
ufile.uploadFile(data, successCallBack, errorCallBack, progressCallBack);
```

### <a name="formUpload">&raquo; 表单上传（formUpload）</a>

#### 接口功能

> 说明：适合使用浏览器的场景并且上传文件内容可以在一次HTTP请求完成，并且所有PUT上传支持的参数都可以在表单上传中指定。

#### 请求参数

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|data |true |object |请求上传的参数 |
|success |false |function |请求成功的回调函数 |
|error |false |function |请求失败的回调函数 |

#### data

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|file |true |File。具体参见[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/File) |请求上传的文件|
|fileRename |false |string |文件的重新命名 |

#### 调用示例

```
ufile.formUpload(data, successCallBack, errorCallBack);
```

### <a name="sliceUpload">&raquo; 分片上传（sliceUpload）</a>

#### 接口功能

> 说明：适合大文件上传

#### 请求参数

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|data |true |object |请求上传的参数 |
|success |false |function |请求成功的回调函数 |
|error |false |function |请求失败的回调函数 |
|progress |false |function |上传进度的回调函数 |

#### data

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|file |true |File。具体参见[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/File) |请求上传的文件|
|fileRename |false |string |文件的重新命名 |

#### success返回

|名称|类型|说明 |
|:----- |:------|:----------------------------- |
|Bucket |string |对象存储空间名称 |
|Key |string |文件名称 |
|FileSize |string |文件大小 |

#### progress返回

|名称|类型|说明 |
|:----- |:------|:----------------------------- |
|status |string |上传状态。init表示初始化分片；uploading表示分片上传中；uploaded表示完成分片。 |
|value |number |上传进度比例。已完成上传文件大小/总上传文件大小的值，位于0-1之间。 |

#### 调用示例

```
ufile.sliceUpload(data, successCallBack, errorCallBack, progressCallBack);
```

### <a name="hitUpload">&raquo; 秒传文件（hitUpload）</a>

#### 接口功能

> 说明：先判断待上传文件的hash值，如果UFile中可以查到此文件，则不必再传文件本身。

#### 请求参数

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|file |true |File。具体参见[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/File) |请求上传的文件。 |
|success |false |function |请求成功的回调函数 |
|error |false |function |请求失败的回调函数 |

#### 调用示例

```
ufile.hitUpload(file, successCallBack, errorCallBack);
```

### <a name="batchUpload">&raquo; 批量上传（batchUpload）</a>

#### 接口功能

> 批量上传文件

#### 请求参数

|名称|必选|类型|说明|
|:----- |:-------|:-----|----- |
|fileList |true |array |批量上传的文件列表。[File](https://developer.mozilla.org/zh-CN/docs/Web/API/File)类型组成的数组列表|
|success |false |function |请求成功的回调函数 |
|error |false |function |请求失败的回调函数 |
|progress |false |function |批量上传进度的回调函数 |

#### progress返回

|名称|类型|说明 |
|:----- |:------|:----------------------------- |
|response |number |上传进度比例。已完成上传文件大小/总上传文件大小的值，位于0-1之间。 |

#### 调用示例

```
ufile.batchUpload(fileList, successCallBack, errorCallBack, progressCallBack);
```
