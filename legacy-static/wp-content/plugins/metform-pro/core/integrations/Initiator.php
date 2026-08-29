<?php

namespace MetForm_Pro\Core\Integrations;

use MetForm_Pro\Core\Integrations\Email\Activecampaign\Active_Campaign_Route;
use MetForm_Pro\Core\Integrations\Pdf_Export\Pdf_Export_Api;
use MetForm_Pro\Core\Integrations\Email_Verification\Email_Verification;
use Metform_Pro\Core\Integrations\Fluent_Crm;
use MetForm_Pro\Core\Integrations\Sms\Sms;

class Initiator {

	public static function autoload() {

		require __DIR__ .'/Mail_Adapter_Contract.php';
		require __DIR__ .'/Mail_Adapter.php';
		require __DIR__ .'/Aweber.php';
		require __DIR__ .'/Convert_Kit.php';
		require __DIR__ .'/Mail_Poet.php';
		require __DIR__ .'/Fluent_Crm.php';
		require __DIR__ .'/sms/sms.php';
	}

	public static function initiate() {

		$aweber = new Aweber();
		$cKit   = new Convert_Kit();
		$mPoet  = new Mail_Poet();
		new Fluent_Crm();
		new Sms();

		#routes
		new Active_Campaign_Route();

		Pdf_Export_Api::instance()->init();
		Email_Verification::instance()->init();
	}
}
