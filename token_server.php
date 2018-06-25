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
        $sign = base64_encode(hash_hmac('sha1', $data, $this->PrivateKey, true));
        $singStr = "UCloud " . $this->PublicKey . ":" . $sign;

        // 上传回调put_policy
        if ($put_policy) {
            $policystr = base64_encode(str_replace('"','\\"',json_encode($put_policy)));
            $singStr = $singStr . ":" . $policystr;
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
        error_log($data, 3, "/tmp/php.log");
        return $this->Sign($data, $put_policy);
    }
}

$method=$_GET['method'];
$bucket=$_GET['bucket'];
$key=$_GET['key'];
$content_md5=$_GET['content_md5'];
$content_type=$_GET['content_type'];
$date=$_GET['date'];

$put_policy=$_GET['put_policy'];

$auth=new UCloud_Auth($UCLOUD_PUBLIC_KEY, $UCLOUD_PRIVATE_KEY);
printf("%s", $auth->SignRequest($method, $bucket, $key, $content_md5, $content_type, $date, $put_policy));

?>
