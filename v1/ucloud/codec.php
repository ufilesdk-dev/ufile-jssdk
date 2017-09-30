<?php

require_once("conf.php");
require_once("http.php");
require_once("utils.php");
require_once("digest.php");


//------------------------------生成转码的api链接------------------------------

function Make_Codec_Request($bucket,$key,$codec_patten_array,$watermark_id,$head_tail_id)
{
	global $UCLOUD_PUBLIC_KEY; 
	global $UCLOUD_PRIVATE_KEY;
	global $UCLOUD_PROXY_SUFFIX;
	$codec_req = array();
	$codec_req["Action"] = "CreateCodecTaskByPatten";
	$codec_req["Url.0"] = "http://".$bucket.$UCLOUD_PROXY_SUFFIX."/".$key;
	$index = 0;
    
	$codec_req["DestBucket"] = $bucket.$UCLOUD_PROXY_SUFFIX;
	foreach($codec_patten_array as $key=>$value)
	{
		$codec_req["CodecPattenId.".$key] = $value;
	}
	if($watermark_id > 0)
	{
		$codec_req["WatermarkPattenId"] = $watermark_id;
	}
	if($head_tail_id > 0)
	{
		$codec_req["HeadTailPattenId"] = $head_tail_id;
	}
	$codec_req["PublicKey"] = $UCLOUD_PUBLIC_KEY;

	return $codec_req;
}

function Create_Codec_Callback($codec_req)
{
	global $UCLOUD_PUBLIC_KEY; 
	global $UCLOUD_PRIVATE_KEY;
	global $CALL_BACK_URL;
	global $CALL_BACK_BODY;
	$CALL_BACK_URL = "http://api.ucloud.cn";
	$CALL_BACK_BODY = "";
	$signstring = "";
   
	ksort($codec_req);
	foreach($codec_req as $key=>$value)
	{
		if(strlen($CALL_BACK_BODY) == 0)
		{
			$CALL_BACK_BODY .= $key."=".urlencode($value);
		}else{
			$CALL_BACK_BODY .= "&".$key."=".urlencode($value);
		}
		$signstring .= $key.$value;
	}
	$signstring .= $UCLOUD_PRIVATE_KEY;

	$signature = sha1($signstring);
	$CALL_BACK_BODY .= "&Signature=".$signature;
}

