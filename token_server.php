<?php

// 公钥
$UCLOUD_PUBLIC_KEY = '';
// 私钥
$UCLOUD_PRIVATE_KEY = '';

// ----------------------------------------------------------
function CanonicalizedResource($bucket, $key)
{
    return "/" . $bucket . "/" . $key;
}

function CanonicalizedUCloudHeaders($headers)
{

    $keys = array();
    foreach($headers as $header) {
        $header = trim($header);
        $arr = explode(':', $header);
        if (count($arr) < 2) continue;
        list($k, $v) = $arr;
        $k = strtolower($k);
        if (strncasecmp($k, "x-ucloud") === 0) {
            $keys[] = $k;
        }
    }

    $c = '';
    sort($keys, SORT_STRING);
    foreach($keys as $k) {
        $c .= $k . ":" . trim($headers[$v], " ") . "\n";
    }
    return $c;
}

class UCloud_Auth {

    public $PublicKey;
    public $PrivateKey;

    public function __construct($publicKey, $privateKey)
    {
        $this->PublicKey = $publicKey;
        $this->PrivateKey = $privateKey;
    }

    public function Sign($data, $put_policy)
    {
        // 上传回调put_policy
        if ($put_policy) {
            $policystr = base64_encode(str_replace('"','\\"',json_encode($put_policy)));
            $singStr = $singStr . ":" . $policystr;
        }
            	
        $sign = base64_encode(hash_hmac('sha1', $data, $this->PrivateKey, true));
        $singStr = "UCloud " . $this->PublicKey . ":" . $sign;

        // 上传回调put_policy
        if ($put_policy) {
            $singStr = $singStr . ":" . $put_policy;
        }

        return $singStr;
    }

    //@results: $token
    public function SignRequest($method, $bucket, $key, $content_md5, $content_type, $date, $put_policy)
    {
        $data = '';
        $data .= strtoupper($method) . "\n";
        $data .= $content_md5 . "\n";
        $data .=  $content_type . "\n";
        $data .= $date . "\n";
        $data .= CanonicalizedResource($bucket, $key);

        //如果有回调，回调字符串参与计算签名
        $put_policy_base64 ="";
        if ($put_policy!="") {
            $put_policy_base64 = $put_policy;
            $data .= $put_policy_base64;
        }
        
        error_log($data, 3, "/tmp/php.log");
        return $this->Sign($data, $put_policy_base64);
    }
}

$method=$_GET['method'];
$bucket=$_GET['bucket'];
$key=$_GET['key'];
$content_md5=$_GET['content_md5'];
$content_type=$_GET['content_type'];
$date=$_GET['date'];

$put_policy=$_GET['put_policy'];	//需要是传已经base64编码后的, 也可以在这个代码里业务固定定制一个

//header('Access-Control-Allow-Origin: *');	//跨域配置，需要根据实际需求设置，这里是允许所有网页请求访问

$auth=new UCloud_Auth($UCLOUD_PUBLIC_KEY, $UCLOUD_PRIVATE_KEY);
printf("%s", $auth->SignRequest($method, $bucket, $key, $content_md5, $content_type, $date, $put_policy));

?>
