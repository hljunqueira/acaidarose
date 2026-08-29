<?php

namespace MetForm_Pro\Core\Integrations;


use MetForm_Pro\XPD_Constants;

class Mail_Poet {

	const MAIL_POET_LISTS_CACHE_KEY = 'mf_mail_poet_lists_key';


	/**
	 * Mail_Poet constructor.
	 *
	 * @param bool $loadActions
	 */
	public function __construct($loadActions = true) {

		if($loadActions) {
			#Registering Aweber authorization check route only
			add_action('wp_ajax_mail_poet_get_email_list_lists', [$this, 'get_email_lists']);
		}
	}


	/**
	 *
	 * @return mixed
	 */
	public function get_email_lists() {

		$lists = [];

		if(class_exists(\MailPoet\API\API::class)) {

			$mailpoet_api = \MailPoet\API\API::MP('v1');

			$mpList = $mailpoet_api->getLists();

			foreach($mpList as $item) {

				$tmp = [];
				$tmp['id'] = $item['id'];
				$tmp['name'] = $item['name'];

				$lists[] = $tmp;
			}

			update_option(self::MAIL_POET_LISTS_CACHE_KEY, $lists);

			return wp_send_json_success([
				'result' => XPD_Constants::RETURN_OKAY,
				'lists' => $lists,
				'msg' => 'successfully retrieved.',
			]);
		}

		return wp_send_json_error([
			'result' => XPD_Constants::RETURN_NOT_OKAY,
			'msg' => 'MailPoet plugin could not found, maybe it is deactivated or uninstalled.'
		]);
	}


	/**
	 *
	 * @param $form_data
	 * @param $settings
	 *
	 * @return mixed
	 */
	public function call_api($form_data, $settings) {

		$listId     = $settings['mail_settings']['mf_mail_poet_list_id'];
		$emailFld   = $settings['email_name'];
		$fNm        = (isset($form_data['mf-listing-fname']) ? $form_data['mf-listing-fname'] : 'NF') ;
		$lNm        = (isset($form_data['mf-listing-lname']) ? $form_data['mf-listing-lname'] : '') ;
		$email      = (isset($form_data[$emailFld]) ? $form_data[$emailFld] : '') ;

		$data['email'] = $email;
		$data['first_name'] = $fNm;
		$data['last_name'] = $lNm;

		return $this->add_subscriber_to_form($listId, $data);
	}


	/**
	 *
	 * @param $formId
	 * @param $form_data
	 *
	 * @return mixed
	 */
	public function add_subscriber_to_form($formId, $form_data) {

		if(class_exists(\MailPoet\API\API::class)) {

			$mailpoet_api = \MailPoet\API\API::MP('v1');

			try {

				$ret = $mailpoet_api->addSubscriber($form_data, [$formId]);

			} catch(\Exception $ex) {

				$return['status'] = 0;
				$return['msg'] = "Something went wrong: " . esc_html($ex->getMessage());

				return $return;
			}

			$return['status'] = 1;
			$return['msg'] = esc_html__('Your data inserted on MailPoet.', 'metform-pro');

			return $return;
		}

		$return['status'] = 0;
		$return['msg'] = esc_html__('MailPoet plugin could not be found.', 'metform-pro');

		return $return;
	}

}