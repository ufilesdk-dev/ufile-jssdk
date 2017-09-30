function UCloudUFile(bucketName, bucketUrl, tokenUrl) {

    // 存储空间名称。既可以在这里配置，也可以在实例化时传参配置。
    // 例如 bucketName = "example-name"
    this.bucketName = bucketName || "";

    // 存储空间域名。既可以在这里配置，也可以在实例化时传参配置。
    // 例如 bucketUrl = "https://example-name.cn-bj.ufileos.com/"
    this.bucketUrl = bucketUrl || "";

    // 计算token的地址
    this.tokenUrl = tokenUrl || "token_server.php";

    this.createAjax = function(argument) {
        var xmlhttp = {};
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }

        // 发送二进制数据
        if(!XMLHttpRequest.prototype.sendAsBinary){
            XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
                function byteValue(x) {
                    return x.charCodeAt(0) & 0xff;
                }
                var ords = Array.prototype.map.call(datastr, byteValue);
                var ui8a = new Uint8Array(ords);
                this.send(ui8a.buffer);
            }
        }

        return xmlhttp;
    };

    this.getBucketUrl = function() {
        var bucketUrl = this.bucketUrl;

        // 如果不是以"/"结尾，则自动补上
        if (bucketUrl.charAt(bucketUrl.length - 1) !== "/") {
            bucketUrl += "/";
        }
        return bucketUrl;
    }

    // 重命名文件
    this.getFileName = function(file, fileRename) {
        var fileName;

        if (fileRename && (fileRename !== "")) {
            fileName = fileRename + file.name.substring(file.name.lastIndexOf("."));
        } else {
            fileName = file.name;
        }

        return fileName;
    }
}

UCloudUFile.prototype.contentMd5 = "";  // 文件的md5
UCloudUFile.prototype.slice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
UCloudUFile.prototype.sliceSize = 4 * 1024 * 1024;  // 分片大小为4M
UCloudUFile.prototype.getExpired = function(second) {
    return Date.parse(new Date()) / 1000 + (second || 600);
}

// 获取文件管理签名token
UCloudUFile.prototype.getUFileToken = function(options, success, error) {

    var method = options.method || "GET";
    var file = options.file || {};
    var fileName = options.fileName;
    var md5Required = options.md5Required;

    var keyName;
    var contentType = options.contentType || file.type || "";

    if (fileName) {
        keyName = fileName;
    } else if (file.FileName) {
        keyName = file.FileName;
    } else {
        keyName = file.name || "";
    }

    var that = this;
    var expired = this.getExpired();
    var tokenUrl = this.tokenUrl;

    this.getContentMd5(file, function(md5) {

        if (md5Required === false) {
            md5 = "";
        }

        var ajax = that.createAjax();
        var url = tokenUrl + "?method=" + method +
            "&bucket=" + that.bucketName +
            "&key=" + encodeURIComponent(keyName) +
            "&content_md5=" + md5 +
            "&content_type=" + contentType +
            "&date=" + "";
        ajax.open("GET", url, true);

        var onreadystatechange = function() {
            if (ajax.readyState === 4) {
                if (ajax.status === 200) {
                    success(ajax.responseText.trim());
                } else {
                    error(ajax.responseText);
                }
            }
        };

        ajax.onreadystatechange = onreadystatechange;
        ajax.send();
    });
}

// 获取文件的内容MD5签名
UCloudUFile.prototype.getContentMd5 = function(file, success) {

    // 如果file不是File对象的实例，则不需要处理Md5
    if (file.size == undefined) {
        success("");
        return;
    }

    var that = this;
    var fileReader = new FileReader();
    var spark = new SparkMD5.ArrayBuffer();
    var chunks = Math.ceil(file.size / this.sliceSize);
    var currentChunk = 0;

    // 每块文件读取完毕之后的处理
    fileReader.onload = function(e) {
        // 每块交由sparkMD5进行计算

        spark.append(e.target.result);
        currentChunk++;

        // 如果文件处理完成计算MD5，如果还有分片继续处理
        if (currentChunk < chunks) {
            loadNext();
        } else {
            that.contentMd5 = spark.end();
            success(that.contentMd5);
        }
    };

    // 处理单片文件的上传
    function loadNext() {
        var start = currentChunk * that.sliceSize;
        var end = start + that.sliceSize >= file.size ? file.size : start + that.sliceSize;

        fileReader.readAsArrayBuffer(that.slice.call(file, start, end));
    }

    loadNext();
}

// 获取文件列表
UCloudUFile.prototype.getFileList = function(success, error) {

    var that = this;
    var method = "GET";
    var requestToken = {
        method: method
    };

    this.getUFileToken(requestToken, function(token) {

        var ajax = that.createAjax();
        var url = that.getBucketUrl() + "?list" +
            "&prefix=" + "" +
            "&marker=" + "" +
            "&limit=" + 20;
        ajax.open(method, url, true);
        ajax.setRequestHeader("Authorization", token);

        var onreadystatechange = function() {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    success(JSON.parse(ajax.response));
                } else {
                    error(ajax.responseText);
                }
            }
        };

        ajax.onreadystatechange = onreadystatechange;
        ajax.send();

    }, error);
}

// 查看文件信息
UCloudUFile.prototype.getFileDetail = function(fileName, success, error) {

    var that = this;
    var method = "HEAD";
    var requestToken = {
        method: method,
        fileName: fileName
    };

    this.getUFileToken(requestToken, function(token) {

        var ajax = that.createAjax();
        var url = that.getBucketUrl() + encodeURIComponent(fileName);
        ajax.open(method, url, true);
        ajax.setRequestHeader("Authorization", token);

        var onreadystatechange = function() {
            if (ajax.readyState === 4) {
                if (ajax.status === 200) {

                    var eTag = ajax.getResponseHeader("ETag");
                    var successRes = {
                        contentType: ajax.getResponseHeader("Content-Type"),
                        eTag: eTag.substring(1, eTag.length - 1),
                        status: ajax.status,
                        response: ajax.response
                    };
                    success(successRes);

                } else {
                    error(ajax.responseText);
                }
            }
        };

        ajax.onreadystatechange = onreadystatechange;
        ajax.send();

    }, error);
}

// 普通上传
UCloudUFile.prototype.uploadFile = function(options, success, error, progress) {

    var that = this;
    var method = "PUT";
    var file = options.file || {};
    var fileRename = options.fileRename;
    var fileName = this.getFileName(file, fileRename);

    var requestToken = {
        method: method,
        file: file,
        fileName: fileName
    };

    this.getUFileToken(requestToken, function(token) {

        var ajax = that.createAjax();
        var url = that.getBucketUrl() + encodeURIComponent(fileName);
        ajax.open(method, url, true);
        ajax.setRequestHeader("Authorization", token);
        ajax.setRequestHeader("Content-MD5", that.contentMd5);
        ajax.setRequestHeader("Content-Type", file.type);

        var onreadystatechange = function() {
            if (ajax.readyState === 4) {
                if (ajax.status === 200) {
                    success({
                        msg: ajax.responseText,
                        file: file
                    });
                } else {
                    error({
                        msg: ajax.responseText,
                        file: file
                    });
                }
            }
        };
        var onprogress = function(event) {
            if (event.lengthComputable) {
                progress(event.loaded / event.total);
            }
        };

        ajax.onreadystatechange = onreadystatechange;
        ajax.upload.onprogress = onprogress;
        ajax.send(file);

    }, error);
}

// 批量上传
UCloudUFile.prototype.batchUpload = function(fileList, success, error, progress) {
    var self = this;
    var successList = [];
    var errorList = [];
    var currentIndex = 0;

    if (fileList.length == 0) {
        console.warn("批量上传列表为空")
        return;
    }

    var successCallBack = function(res) {
        successList.push(res.file);
        progress(successList.length/fileList.length);

        if (successList.length == fileList.length) {
            success(successList);

        } else {
            currentIndex++;
            self.uploadFile({file: fileList[currentIndex]}, successCallBack, errorCallBack, progressCallBack);
        }
    };

    var errorCallBack = function(res){
        errorList.push(res.file);

        if ((successList.length + errorList.length) == fileList.length) {
            error({
                errorList: errorList,
                successList: successList
            });
        }
    };
    var progressCallBack = function(res) {

    };

    progress(0);
    self.uploadFile({file: fileList[currentIndex]}, successCallBack, errorCallBack, progressCallBack);
}

// 分片上传（外部调用）
UCloudUFile.prototype.sliceUpload = function(options, success, error, progress) {
    var that = this;
    var file = options.file || {};
    var fileRename = options.fileRename;
    var fileName = this.getFileName(file, fileRename);

    var fileReader = new FileReader();
    var chunks = Math.ceil(file.size / this.sliceSize);
    var currentChunk = 0;

    // 初始化分片
    this.initMultipartUpload(function(intResponse) {
        var keyName = intResponse.Key;
        var uploadId = intResponse.UploadId;
        var partNumber = 0;
        var requestSuccess = 0;  // 各分片请求成功数
        var eTags = "";

        // 每块文件读取完毕之后的处理
        fileReader.onload = function(e) {
            currentChunk++;

            // 如果文件处理完，调用完成分片；否则还有分片则继续处理
            if (currentChunk < chunks) {
                loadNext();
            }
        };

        // 处理单片文件的上传
        function loadNext() {

            var start = currentChunk * that.sliceSize;
            var end = start + that.sliceSize >= file.size ? file.size : start + that.sliceSize;
            var currentFile = that.slice.call(file, start, end);
            currentFile.name = file.name;

            // 上传各分片
            that.multipartUploading(function(multipartResponse) {
                requestSuccess++;
                if (eTags == "") {
                    eTags = multipartResponse.eTag;
                } else {
                    eTags = eTags + "," + multipartResponse.eTag;
                }

                var sliceCompleted = {
                    status: "uploading",
                    value: requestSuccess / chunks
                };
                progress(sliceCompleted);  // 上传各分片进度

                if (requestSuccess == chunks) {
                    // 完成分片
                    that.multipartUploaded(function(uploaded) {
                        success(uploaded);

                    }, error, progress, keyName, uploadId, file, eTags);
                }
            }, error, keyName, uploadId, partNumber, currentFile);

            partNumber++;
            fileReader.readAsArrayBuffer(currentFile);
        }

        loadNext();

    }, error, progress, file, fileName);
}

// 初始化上传（内部调用）
UCloudUFile.prototype.initMultipartUpload = function(success, error, progress, file, fileName) {
    var that = this;
    var method = "POST";
    var contentType = file.type || "";  // application/octet-stream
    var requestToken = {
        method: method,
        file: file,
        fileName: fileName,
        md5Required: false
    }

    this.getUFileToken(requestToken, function(token) {

        var ajax = that.createAjax();
        var url = that.getBucketUrl() + encodeURIComponent(fileName) + "?uploads";
        ajax.open(method, url, true);
        ajax.setRequestHeader("Authorization", token);
        ajax.setRequestHeader("Content-Type", contentType);

        var onreadystatechange = function() {
            if (ajax.readyState === 4) {
                if (ajax.status === 200) {
                    success(JSON.parse(ajax.response));
                } else {
                    error(ajax.responseText);
                }
            }
        };
        var onprogress = function(event) {
            if (event.lengthComputable) {
                var result = {
                    status: "init",
                    value: event.loaded / event.total
                };
                progress(result);
            }
        };

        ajax.onreadystatechange = onreadystatechange;
        ajax.upload.onprogress = onprogress;
        ajax.send();

    }, error);
}

// 上传分片（内部调用）
UCloudUFile.prototype.multipartUploading = function(success, error, keyName, uploadId, partNumber, file) {
    var that = this;
    var method = "PUT";
    var requestToken = {
        method: method,
        file: file,
        fileName: keyName,
        md5Required: false
    }

    this.getUFileToken(requestToken, function(token) {

        var ajax = that.createAjax();
        var url = that.getBucketUrl() + encodeURIComponent(keyName) +
            "?uploadId=" + uploadId +
            "&partNumber=" + partNumber;
        ajax.open(method, url, true);
        ajax.setRequestHeader("Authorization", token);
        ajax.setRequestHeader("Content-Type", file.type);

        var onreadystatechange = function() {
            if (ajax.readyState === 4) {
                if (ajax.status === 200) {
                    var eTag = ajax.getResponseHeader("ETag");
                    var result = {
                        eTag: eTag.substring(1, eTag.length - 1),
                        response: ajax.response
                    };
                    success(result);
                } else {
                    error(ajax.responseText);
                }
            }
        };

        ajax.onreadystatechange = onreadystatechange;
        ajax.send(file);

    }, error);
}

// 完成分片（内部调用）
UCloudUFile.prototype.multipartUploaded = function(success, error, progress, keyName, uploadId, file, eTags) {
    var that = this;
    var method = "POST";
    var contentType = file.type || "application/octet-stream";
    var requestToken = {
        method: method,
        file: file,
        fileName: keyName,
        md5Required: false,
        contentType: contentType
    };

    this.getUFileToken(requestToken, function(token) {

        var ajax = that.createAjax();
        var url = that.getBucketUrl() + encodeURIComponent(keyName) + "?uploadId=" + uploadId;

        ajax.open(method, url, true);
        ajax.setRequestHeader("Authorization", token);
        ajax.setRequestHeader("Content-Type", contentType);

        var onreadystatechange = function() {
            if (ajax.readyState === 4) {
                if (ajax.status === 200) {
                    success(ajax.responseText);
                } else {
                    error(ajax.responseText);
                }
            }
        };
        var onprogress = function(event) {
            if (event.lengthComputable) {
                var result = {
                    status: "uploaded",
                    value: event.loaded / event.total
                };
                progress(result);
            }
        };

        ajax.onreadystatechange = onreadystatechange;
        ajax.upload.onprogress = onprogress;
        ajax.send(eTags);

    }, error);
}

// 表单上传
UCloudUFile.prototype.formUpload = function(options, success, error) {
    var that = this;
    var method = "POST";
    var file = options.file || {};
    var fileRename = options.fileRename;
    var fileName = this.getFileName(file, fileRename);

    var requestToken = {
        method: method,
        file: file,
        fileName: fileName
    };

    this.getUFileToken(requestToken, function(token) {

        var ajax = that.createAjax();
        var url = that.getBucketUrl();
        var reader = new FileReader();

        // FileReader API是异步的,我们需要把读取到的内容存储下来
        reader.addEventListener("load", function () {

            var byteArray = new Uint8Array(reader.result);
            var fileBinary = "";

            for (var i = 0; i < byteArray.length; i++) {
                fileBinary += String.fromCharCode(byteArray[i]);
            }

            file.binary = fileBinary;

            // 虚拟出Blob格式的fileName
            var blobFileName = new Blob([fileName]);
            // Blob格式的fileName的FileReader
            var readerFileName = new FileReader();

            // 取得fileName的特定编码格式
            readerFileName.addEventListener("load", function () {
                var innerByteArray = new Uint8Array(readerFileName.result);
                var innerFileBinary = "";

                for (var i = 0; i < innerByteArray.length; i++) {
                    innerFileBinary += String.fromCharCode(innerByteArray[i]);
                }

                var reFileName = innerFileBinary;

                var boundary = "----UCloudPOSTFormBoundary";
                var data = "--" + boundary + "\r\n" +
                    "Content-Disposition: form-data; " + 'name="FileName"' + "\r\n" + "\r\n" +
                    reFileName + "\r\n" +
                    "--" + boundary + "\r\n" +
                    "Content-Disposition: form-data; " + 'name="Authorization"' + "\r\n" + "\r\n" +
                    token + "\r\n" +
                    "--" + boundary + "\r\n" +
                    "Content-Disposition: form-data; " + 'name="file"; ' + 'filename="' + reFileName + '"' + "\r\n" +
                    "Content-Type: " + file.type + "\r\n" + "\r\n" +
                    file.binary + "\r\n" +
                    "--" + boundary + "--" + "\r\n";

                ajax.open(method, url, true);
                ajax.setRequestHeader("Content-MD5", that.contentMd5);
                ajax.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);

                var onreadystatechange = function() {
                    if (ajax.readyState == 4) {
                        if (ajax.status == 200) {
                            success(ajax.response);
                        } else {
                            error(ajax.response);
                        }
                    }
                };
                ajax.onreadystatechange = onreadystatechange;
                ajax.sendAsBinary(data);

            });

            // 读取Blob格式的fileName
            if (blobFileName) {
                readerFileName.readAsArrayBuffer(blobFileName);
            }
        });

        // 读取文件的二进制内容
        if (file) {
            reader.readAsArrayBuffer(file);
        }

    }, error);
}

// 秒传文件
UCloudUFile.prototype.hitUpload = function(file, success, error) {
    var that = this;
    var method = "POST";

    this.getFileDetail(file.name, function(fileDetail) {
        var requestToken = {
            method: method,
            file: file,
            md5Required: false
        };

        that.getUFileToken(requestToken, function(token) {

            var ajax = that.createAjax();
            var url = that.getBucketUrl() +
                "uploadhit?Hash=" + fileDetail.eTag +
                "&FileName=" + encodeURIComponent(file.name) +
                "&FileSize=" + file.size;
            ajax.open(method, url, true);
            ajax.setRequestHeader("Authorization", token);
            ajax.setRequestHeader("Content-Type", file.type);

            var onreadystatechange = function() {
                if (ajax.readyState === 4) {
                    if (ajax.status === 200) {
                        success(ajax.responseText);
                    } else {
                        error(ajax.responseText);
                    }
                }
            };

            ajax.onreadystatechange = onreadystatechange;
            ajax.send(file);

        }, error);

    }, error);
}

// 下载文件
UCloudUFile.prototype.downloadFile = function(fileName, success, error, progress) {
    var that = this;
    var method = "GET";
    var requestToken = {
        method: method,
        fileName: fileName
    };

    this.getUFileToken(requestToken, function(token) {

        var ajax = that.createAjax();
        var url = that.getBucketUrl() + encodeURIComponent(fileName);
        ajax.open(method, url, true);
        ajax.responseType = "blob";
        ajax.setRequestHeader("Authorization", token);

        var onreadystatechange = function() {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    var aTag = document.createElement("a");
                    var blob = ajax.response;

                    aTag.download = fileName;
                    aTag.href = URL.createObjectURL(blob);
                    aTag.click();
                    URL.revokeObjectURL(blob);
                    success(ajax.response);

                } else {
                    error(ajax.response)
                }
            }
        };
        var onprogress = function(event) {
            if (event.lengthComputable) {
                progress(event.loaded / event.total);
            }
        };

        ajax.onreadystatechange = onreadystatechange;
        ajax.onprogress = onprogress;
        ajax.send();

    }, error);
}

// 删除文件
UCloudUFile.prototype.deleteFile = function(fileName, success, error) {
    var that = this;
    var method = "DELETE";
    var requestToken = {
        method: method,
        fileName: fileName
    };

    this.getUFileToken(requestToken, function(token) {

        var ajax = that.createAjax();
        var url = that.getBucketUrl() + encodeURIComponent(fileName);
        ajax.open(method, url, true);
        ajax.setRequestHeader("Authorization", token);

        var onreadystatechange = function() {
            if (ajax.readyState == 4) {
                if (ajax.status == 204) {
                    success({
                        msg: ajax.responseText,
                        file: fileName
                    });
                } else {
                    error({
                        msg: ajax.responseText,
                        file: fileName
                    });
                }
            }
        };

        ajax.onreadystatechange = onreadystatechange;
        ajax.send();

    }, error);
}

// 批量删除
UCloudUFile.prototype.batchDelete = function(fileList, success, error) {
    var self = this;
    var successList = [];
    var errorList = [];

    if (fileList.length == 0) {
        console.warn("删除列表为空")
        return;
    }

    for (var i=0; i<fileList.length; i++) {
        var successCallBack = function(res) {
            successList.push(res.file);

            if (successList.length == fileList.length) {
                success(successList)
            }

        };

        var errorCallBack = function(res){
            errorList.push(res.file);

            if ((successList.length + errorList.length) == fileList) {
                error({
                    successList: successList,
                    errorList: errorList
                })
            }
        }

        this.deleteFile(fileList[i], successCallBack, errorCallBack);
    }

}

