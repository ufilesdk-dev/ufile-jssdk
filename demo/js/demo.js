$(document).ready(function() {

    /* 
        公私钥 
        1、测试环境下，只需配置tokenPublicKey和tokenPrivateKey，无需设置tokenServerUrl
        2、正式环境通过配置tokenServerUrl，获取公私钥
    */

    // 令牌公钥。既可以在这里配置，也可以在SDK中全局配置。
    // var tokenPublicKey = 'TOKEN_48b6cXXXXXXc-42b5-9853-4d25cc22927b';
    var tokenPublicKey = '';
    // 令牌私钥。既可以在这里配置，也可以在SDK中全局配置。
    // var tokenPrivateKey = 'eda2585XXXXXX-40a7-be17-adf7a6bc5d59';
    var tokenPrivateKey = '';

    // 计算token的地址。既可以在这里配置，也可以在SDK中全局配置。
    // 例如 tokenServerUrl = "http://localhost:8080/token_server.php";
    var tokenServerUrl = "";


    // 存储空间名称。既可以在这里配置，也可以在SDK中全局配置。
    // 例如 var bucketName = "example-name";
    var bucketName = "";

    // 存储空间域名URL地址。既可以在这里配置，也可以在SDK中全局配置。
    // 例如 var bucketUrl = "https://example-name.cn-bj.ufileos.com/";
    var bucketUrl = "";

    

    //令牌配置的前缀，无前缀填空字符串
    var prefix = '';

    // 实例化UCloudUFile
    var ufile =  new UCloudUFile(bucketName, bucketUrl, tokenPublicKey, tokenPrivateKey, tokenServerUrl, prefix);

    // 批量上传队列
    var batchUploadList = [];

    var errorCallBack = function(res){
        $("#result").html("errorCallBack: " + JSON.stringify(res));
        console.error("errorCallBack", res)
    };

    // 显示当前配置信息
    $("#configInfo").append('<p>// 填写tokenPublicKey和tokenPrivateKey可实现SDK内部签名计算，填写tokenServerUrl可实现服务端签名计算</p>')
    $("#configInfo").append('<p>// SDK内部签名计算可用于调试，服务端签名计算用于开发环境</p>')
   if(tokenServerUrl) {
        $("#configInfo").append('<p>【当前demo实现服务端签名计算】</p>')
        $("#configInfo").append('<p>tokenServerUrl：' + tokenServerUrl + '</p>')
    } else if(tokenPublicKey && tokenPrivateKey) {
        $("#configInfo").append('<p>【当前demo实现SDK内部签名计算】</p>')
        $("#configInfo").append('<p>tokenPublicKey：' + tokenPublicKey + '</p>')
        $("#configInfo").append('<p>tokenPrivateKey：' + tokenPrivateKey + '</p>')
    }
    $("#configInfo").append('<p>bucketName：' + bucketName + '</p>')
    $("#configInfo").append('<p>bucketUrl：' + bucketUrl + '</p>')
    $("#configInfo").append('<p>prefix：' + prefix + '</p>')

    // 切换Tab清空返回值
    $(".nav li").on("click", function() {
        $("#result").empty();
    });

    // 获取文件列表
    $("#getFileList").on("click", function() {

        $('.file-list').removeClass("hide");
        $('#batchDelete').removeClass("hide");
        var prefix = $(".prefix-fileList").val();
        var marker = $(".marker-fileList").val();
        var limit = $(".limit-fileList").val();

        var data = {
            prefix: prefix,
            marker: marker,
            limit: limit
        };

        var successCallBack = function(res) {

            $(".files-tbody").empty();
            $("#result").html(JSON.stringify(res));

            res.DataSet.map(function(item) {
                var file = JSON.stringify(item);

                $(".files-tbody").append('<tr>'+
                    '<td>'+ '<input  type="checkbox"  name="file" value="' + item.FileName + '"></input>' +'</td>'+
                    '<th scope="row">'+item.FileName+'</th>'+
                    '<td>'+item.Size+'B'+'</td>'+
                    '<td>'+item.MimeType+'</td>'+
                    '<td>'+
                        '<button data-file=\''+file+'\' class="getFileDetail btn btn-default">查看</button>'+
                        '<button data-file=\''+file+'\' class="downloadFile btn btn-default">下载</button>'+
                        '<button data-file=\''+file+'\' class="deleteFile btn btn-default">删除</button>'+
                    '</td>'+
                '</tr>');
            });
        };

        ufile.getFileList(data, successCallBack, errorCallBack);
    });

    // 查看文件信息
    $(document).on("click", ".getFileDetail", function(e) {

        var fileName =  $(e.currentTarget).data("file").FileName;
        var successCallBack = function(res) {
            $("#result").html(JSON.stringify(res));
        };

        ufile.getFileDetail(fileName, successCallBack, errorCallBack);
    });

    // 下载文件
    $(document).on("click", ".downloadFile", function(e) {

        var fileName =  $(e.currentTarget).data("file").FileName;
        var successCallBack = function(res) {
            $("#result").html("下载成功");
            $("#result").append(JSON.stringify(res));
        };
        var progressCallBack = function(res) {
            var percentComplete = "下载进度：" + (res * 100) + "%";
            $("#result").html(percentComplete);
        };

        ufile.downloadFile(fileName, successCallBack, errorCallBack, progressCallBack);
    });

    // 删除文件
    $(document).on("click", ".deleteFile",function(e) {

        var fileName =  $(e.currentTarget).data("file").FileName;
        var successCallBack = function(res) {
            $("#result").html("删除成功");
            $("#result").append(JSON.stringify(res));
        };

        ufile.deleteFile(fileName, successCallBack, errorCallBack);
    });

    // 批量删除
    $(document).on("click", "#batchDelete",function(e) {
        var fileList = [];
        var checkedElements = $(".file-list input:checked");

        for (var i=0; i<checkedElements.length; i++) {
            fileList.push(checkedElements[i].value);
        }

        var successCallBack = function(res) {
            $("#result").html("删除成功");
            $("#result").append(JSON.stringify(res));
        };

        ufile.batchDelete(fileList, successCallBack, errorCallBack);

    });

    // uploader监听
    $("#uploader").on("change", uploaderChange);

    function uploaderChange() {

        var activeTab = $("ul.nav-tabs li.active").children("a").attr("href");

        // 普通上传
        if (activeTab  == "#tab2") {
            var fileRename = $(".rename-uploadFile").val();
            var file = document.getElementById("uploader").files[0];

            var data = {
                file: file,
                fileRename: fileRename
            };

            var successCallBack = function(res) {
                $("#result").html("上传成功");
                $("#result").append(JSON.stringify(res));
            };
            var progressCallBack = function(res) {
                var percentComplete = "上传进度：" + (res * 100) + "%";
                $("#result").html(percentComplete);
            };

            ufile.uploadFile(data, successCallBack, errorCallBack, progressCallBack);

        // 表单上传
        } else if (activeTab  == "#tab3") {
            var fileRename = $(".rename-formUpload").val();
            var file = document.getElementById("uploader").files[0];

            var data = {
                file: file,
                fileRename: fileRename
            };

            var successCallBack = function(res) {
                $("#result").html("上传成功");
                $("#result").append(JSON.stringify(res));
            };

            ufile.formUpload(data, successCallBack, errorCallBack);

        // 分片上传
        }  else if (activeTab  == "#tab4") {
            var fileRename = $(".rename-sliceUpload").val();
            var file = document.getElementById("uploader").files[0];

            var data = {
                file: file,
                fileRename: fileRename
            };

            var successCallBack = function(res) {
                $("#result").html("上传成功");
                $("#result").append(JSON.stringify(res));
            };
            var progressCallBack = function(res) {

                var tips = "";
                if (res.status == "init") {
                    tips = "初始化分片：";
                } else if (res.status == "uploading") {
                    tips = "分片上传中：";
                }  else if (res.status == "uploaded") {
                    tips = "完成分片：";
                }
                var percentComplete = (res.value * 100) + "%";
                $("#result").html( tips + percentComplete);
            };

            ufile.sliceUpload(data, successCallBack, errorCallBack, progressCallBack);

        // 秒传文件
        }  else if (activeTab  == "#tab5") {
            var file = document.getElementById("uploader").files[0];
            var successCallBack = function(res) {
                $("#result").html("秒传成功");
                $("#result").append(JSON.stringify(res));
            };

            ufile.hitUpload(file, successCallBack, errorCallBack);

        // 上传回调
        }  else if (activeTab  == "#tab7") {
            var fileRename = $(".rename-putPolicy").val();
            var putPolicy = $(".putPolicy-json").val();
            var file = document.getElementById("uploader").files[0];

            var data = {
                file: file,
                fileRename: fileRename,
                putPolicy: putPolicy
            };

            var successCallBack = function(res) {
                $("#result").html("上传成功");
                $("#result").append(JSON.stringify(res));
            };

            ufile.formUpload(data, successCallBack, errorCallBack);

        }

        // 重新增加uploader DOM
        $(this).remove();
        $('<input type="file" id="uploader" name="uploader" class="form-control hide" />').on("change", uploaderChange).appendTo($("#uploaderWrap"))
    }

    // 普通上传
    $("#uploadFile").on("click", function() {
        $("#uploader").trigger("click");
    });

    // 表单上传
    $("#formUpload").on("click", function() {
        $("#uploader").trigger("click");
    });

    // 分片上传
    $("#sliceUpload").on("click", function() {
        $("#uploader").trigger("click");
    });

    // 秒传文件
    $("#hitUpload").on("click", function() {
        $("#uploader").trigger("click");
    })

    // 生成批量上传BatchUploader DOM
    function createBatchUploader() {
        var batchUploaderEle = document.getElementById("batchUploader");

        if (batchUploaderEle == null) {
            var batchUploader = document.createElement("input");
            batchUploader.setAttribute("type", "file");
            batchUploader.setAttribute("class", "form-control hide");
            batchUploader.setAttribute("id", "batchUploader");
            batchUploader.setAttribute("multiple", "multiple");
            // 限制文件类型
            // accept="image/png" or accept=".png" — 只接受 png 图片.
            // accept="image/png, image/jpeg" or accept=".png, .jpg, .jpeg" — PNG/JPEG 文件.
            // accept="image/*" — 接受任何图片文件类型. 在Chrome55里面，会存在响应慢等情况，建议指明文件类型
            // accept=".doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" — 接受任何 MS Doc 文件类型.
            // batchUploader.setAttribute("accept", "image/gif,image/png"); - 只能传image/gif,image/png的类型
            document.getElementById('batchUploaderWrap').appendChild(batchUploader);
        }
    }

    createBatchUploader();

    // 监听batchUploader的change事件
    $("#batchUploader").on("change", function() {
        var fileList = document.getElementById("batchUploader").files;
        renderFiles(fileList);
    });

    // 批量上传添加文件按钮
    $("#addFile").on("click", function() {
        console.log("addFile:click", $("#batchUploader"))
        $("#batchUploader").trigger("click");
    });

    // 渲染文件队列
    function renderFiles(fileList) {

        for (var i=0; i<fileList.length; i++) {

            var file = fileList[i];

            batchUploadList.push(file);

            // 是否为图片格式
            if (file.type.indexOf("image") > -1) {
                var url = window.URL.createObjectURL(file)
                var imgElement = document.createElement("img");
                imgElement.setAttribute("src", url);
                imgElement.setAttribute("class", "file-item");
                document.getElementById('batchList').appendChild(imgElement);

            } else {
                var divElement = document.createElement("div");
                var textNode = document.createTextNode(file.name);
                divElement.setAttribute("src", url);
                divElement.setAttribute("class", "file-item");
                divElement.appendChild(textNode);
                document.getElementById('batchList').appendChild(divElement);
            }
        }
    }

    // 批量上传：拖到文件
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', dragOver, false);
    dropZone.addEventListener('drop', fileSelect, false);

    function fileSelect(evt) {
        // 必须阻止dragenter和dragover事件的默认行为，这样才能触发 drop 事件
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files; // 文件对象

        renderFiles(files);
    }

    function dragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }

    // 清除文件
    $("#clearUpload").on("click", function() {
        $("#batchList").empty();
        $("#batchUploader").val("");
        $("#result").empty();
        batchUploadList = [];
    })

    // 批量上传
    $("#batchUpload").on("click", function() {

        var successCallBack = function(res) {
            $("#result").html("上传成功");
            $("#result").append(JSON.stringify(res));
        };
        var progressCallBack = function(res) {
            var percentComplete = "上传进度：" + (res * 100) + "%";
            $("#result").html(percentComplete);
        };

        ufile.batchUpload(batchUploadList, successCallBack, errorCallBack, progressCallBack);

    });

    // 上传回调
    $("#putPolicy").on("click", function() {
        $("#uploader").trigger("click");
    });

});
