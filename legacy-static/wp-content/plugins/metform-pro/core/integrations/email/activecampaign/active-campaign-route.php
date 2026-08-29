<?php

namespace MetForm_Pro\Core\Integrations\Email\Activecampaign;

use MetForm_Pro\Base\Api;

class Active_Campaign_Route extends Api {

	const SK_API_KEY = 'mf_active_campaign_api_key';
	const SK_CAMP_URL = 'mf_active_campaign_url';
	const METFORM_SETTINGS_KEY_ALL = 'metform_option__settings';

	public function config() {

		$this->prefix = 'active-campaign';

		/**
		 * Be careful regarding this value
		 */
		$this->param = "";
	}


	public function get_email_lists() {

		$sett = $this->retrieve_api_key();

		if(empty($sett[self::SK_CAMP_URL]) || empty($sett[self::SK_API_KEY])) {

			return wp_send_json_error(
				[
					'msg'  => '<span style="margin-left: 10px; background-color: transparent; border: 1px solid #E81454; color: #E81454; border-radius: 3px;padding: 1px 5px;">' . esc_html__('Campaign url or API key is not yet set!', 'metform-pro') . '</span>',
				]
			);
		}

		$token = $sett[self::SK_API_KEY];
		$uri = $sett[self::SK_CAMP_URL];
		$full_url = $uri . '/api/3/lists';

		$allLists = [];

		$config = [];

		$headers = [
			'Content-Type' => 'application/json; charset=utf-8',
			'Api-Token'    => $token,
		];

		$payLoad = [
			'headers' => $headers,
			'method'  => 'GET',
			'body'    => $config,
		];


		try {

			$offset = 0;
			do {
				
				$payLoad['body'] = [
					'offset' => $offset,
				];

				$response = wp_remote_get(add_query_arg('offset', $offset, $full_url), $payLoad);
				
				if (is_wp_error($response)) {
					return wp_send_json_error([
						'msg' => $response->get_error_message(),
					]);
				}
	
				$json = json_decode($response['body']);
	
				if (isset($json->lists)) {
					$lists = $json->lists;
	
					foreach ($lists as $item) {
						$tmp = [
							'sid' => $item->id,
							'strid' => $item->stringid,
							'usr' => $item->userid,
							'name' => $item->name,
						];
						$allLists[] = $tmp;
					}
	
					// Increment offset for next request
					$offset += count($lists);
				} else {
					break; // Break the loop if no more lists are returned
				}
			} while (!empty($lists));
	
			update_option(Active_Campaign::CK_ACT_CAMP_EMAIL_LIST_CACHE_KEY, $allLists);
	
			return wp_send_json_success([
				'result' => 'ok',
				'list' => $allLists,
				'msg' => 'Successfully retrieved.',
			]);

		} catch(\Exception $ex) {

			return wp_send_json_error(
				[
					'msg' => $ex->getMessage(),
				]
			);
		}
		
	}


	public function get_tag_lists()
	{

		$sett = $this->retrieve_api_key();

		if (empty($sett[self::SK_CAMP_URL]) || empty($sett[self::SK_API_KEY])) {

			return wp_send_json_error(
				[
					'msg'  => '<span style="margin-left: 10px; background-color: transparent; border: 1px solid #E81454; color: #E81454; border-radius: 3px;padding: 1px 5px;">' . esc_html__('Campaign url or API key is not yet set!', 'metform-pro') . '</span>',
				]
			);
		}

		$token = $sett[self::SK_API_KEY];
		$uri = $sett[self::SK_CAMP_URL];
		$full_url = $uri . '/api/3/tags';

		$allTags = [];

		$config = [];

		$headers = [
			'Content-Type' => 'application/json; charset=utf-8',
			'Api-Token'    => $token,
		];

		$payLoad = [
			'headers' => $headers,
			'method'  => 'GET',
			'body'    => $config,
		];


		try {

			$offset = 0;
			do {
				// Update the payload with the offset
				$payLoad['body'] = [
					'offset' => $offset,
				];

				$response = wp_remote_get($full_url, $payLoad);

				if (is_wp_error($response)) {
					return wp_send_json_error([
						'msg' => $response->get_error_message(),
					]);
				}

				$json = json_decode($response['body']);

				if (isset($json->tags)) {
					$tags = $json->tags;


					foreach ($tags as $item) {
						$tmp = [
							'sid' => $item->id,
							'desc' => $item->description,
							'name' => $item->tag,
						];
						$allTags[] = $tmp;
					}

					// Increment offset for next request
					$offset += count($tags);
				} else {
					break; // Break the loop if no more tags are returned
				}
			} while (!empty($tags));

			update_option(Active_Campaign::CK_ACT_CAMP_TAG_LIST_CACHE_KEY, $allTags);

			return wp_send_json_success([
				'result' => 'ok',
				'list' => $allTags,
				'msg' => 'Successfully retrieved.',
			]);
		} catch (\Exception $ex) {
			return wp_send_json_error([
				'msg' => $ex->getMessage(),
			]);
		}
	}


	public function retrieve_api_key() {

		$sett = get_option(self::METFORM_SETTINGS_KEY_ALL);

		return $sett;
	}

	public function get_testing() {

		echo 'sdfsd fs d fdsfsd dsfs';

		return [
			'status'  => 'success',
			'list'  => [],
			'message' => esc_html__('Tags successfully fetched.', 'metform-pro'),
		];
	}

	public function post_testing() {

		return [
			'status'  => 'success',
			'list'  => [],
			'message' => esc_html__('Tags successfully fetched.', 'metform-pro'),
		];
	}
}
