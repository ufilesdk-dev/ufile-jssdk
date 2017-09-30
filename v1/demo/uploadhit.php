<?php

require_once('../ucloud/proxy.php');

$bucket = 'your bucket';
$key    = 'your key';
$file   = 'local file path';

list($data, $err) = UCloud_UploadHit($bucket, $key, $file);
if ($err) {
	echo "error: " . $err->ErrMsg . "\n";
	echo "code: " . $err->Code . "\n";
	exit;
}

echo "upload hit success\n";
