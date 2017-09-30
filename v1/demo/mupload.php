<?php

require_once('../ucloud/proxy.php');

$bucket = 'tdtest';
$key    = 'lhb.mp4';
$file   = '/home/guitazhang/php/lhb.mp4';

$codecpattenlist = array();
$codecpattenlist[0] = 129;
$codecpattenlist[1] = 130;
$watermark_id = 129;
$head_tail_id = 129;
$codec_req = Make_Codec_Request($bucket,$key,$codecpattenlist,$watermark_id,$head_tail_id);
Create_Codec_Callback($codec_req);
print_r("callback_url=".$CALL_BACK_URL."\n");
print_r("callback_body=".$CALL_BACK_BODY."\n");

list($data, $err) = UCloud_MInit($bucket, $key);
if ($err)
{
	echo "error: " . $err->ErrMsg . "\n";
	echo "code: " . $err->Code . "\n";
	exit;
}

$uploadId = $data['UploadId'];
$blkSize  = $data['BlkSize'];
echo "UploadId: " . $uploadId . "\n";
echo "BlkSize:  " . $blkSize . "\n";

list($etagList, $err) = UCloud_MUpload($bucket, $key, $file, $uploadId, $blkSize);
if ($err) {
	echo "error: " . $err->ErrMsg . "\n";
	echo "code: " . $err->Code . "\n";
	exit;
}

$put_policy = new UCloud_PutPolicy($CALL_BACK_URL, $CALL_BACK_BODY, "GET");

list($data, $err) = UCloud_MFinish($bucket, $key, $uploadId, $etagList, "", $put_policy);
if ($err) {
	echo "error: " . $err->ErrMsg . "\n";
	echo "code: " . $err->Code . "\n";
	exit;
}
echo "Etag:     " . $data['ETag'] . "\n";
echo "FileSize: " . $data['FileSize'] . "\n";
