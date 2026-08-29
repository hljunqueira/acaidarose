<?php

namespace MetForm_Pro\Core\Integrations\Payment;

defined('ABSPATH') || exit;

class Paypal
{
	use \MetForm\Traits\Singleton;

	private static $instance;

	private $key_form_id;
	private $key_form_data;
	private $form_data;
	private $key_payment_status;
	private $key_payment_invoice;
	private $key_page_id;

	private $entry_id;
	private $form_id;
	private $form_settings;
	private $payment_input_name;
	private $payment_status;
	private $map_data;
	private $payment_first_name;
	private $payment_last_name;
	private $mf_request_page_url;

	// for notify user about payment
	private $email_user;

	public function __construct()
	{
		$this->key_form_id = 'metform_entries__form_id';
		$this->key_form_data = 'metform_entries__form_data';
		$this->key_payment_status = 'metform_entries__payment_status';
		$this->key_payment_invoice = 'metform_entries__payment_invoice';
		$this->key_page_id = 'mf_page_id';
	}

	public function init($args, $request)
	{

		$this->entry_id = $args['entry_id'];

		$type = $args['action'];

		$this->form_data = get_post_meta($this->entry_id, $this->key_form_data, true);

		$this->form_id = get_post_meta($this->entry_id, $this->key_form_id, true);

		$this->payment_status = get_post_meta($this->entry_id, $this->key_payment_status, true);

		$this->mf_request_page_url = get_permalink(get_post_meta($this->entry_id, $this->key_page_id, true));

		$this->map_data = '';
		$this->payment_input_name = '';   
		$this->payment_first_name = '';
		$this->payment_last_name = '';

		if (did_action('metform/after_load')) {

			$this->form_settings = \MetForm\Core\Forms\Action::instance()->get_all_data($this->form_id);

			$this->map_data = \MetForm\Core\Entries\Action::instance()->get_fields($this->form_id);

			$this->payment_input_name = \MetForm\Core\Entries\Action::instance()->get_input_name_by_widget_type('mf-payment-method', $this->map_data);

			$this->payment_first_name = \MetForm\Core\Entries\Action::instance()->get_input_name_by_widget_type('mf-listing-fname', $this->map_data);

			$this->payment_last_name = \MetForm\Core\Entries\Action::instance()->get_input_name_by_widget_type('mf-listing-lname', $this->map_data);
		}

		$first_name = '';
		if($this->payment_first_name && isset($this->payment_first_name[0]) && $this->form_data[$this->payment_first_name[0]]){
			$first_name = $this->form_data[$this->payment_first_name[0]];
		}

		$last_name = '';
		if($this->payment_last_name && isset($this->payment_last_name[0]) && $this->form_data[$this->payment_last_name[0]]){
			$last_name = $this->form_data[$this->payment_last_name[0]];
		}

		// success URl
		$success_url = get_site_url() . '/';
		if (isset($this->form_settings['success_url']) && filter_var($this->form_settings['success_url'], FILTER_VALIDATE_URL)) {
			$success_url = $this->form_settings['success_url'];
		}
		$url_success = [];
		$url_success['entry_id'] = $this->entry_id;

		// cancel URl
		$cancel_url = get_site_url() . '/';
		if (isset($this->form_settings['failed_cancel_url']) && filter_var($this->form_settings['failed_cancel_url'], FILTER_VALIDATE_URL)) {
			$cancel_url = $this->form_settings['failed_cancel_url'];
		}
		$url_cancel = [];
		$url_cancel['entry_id'] = $this->entry_id;
		$cancel_url = \MetForm_Pro\Utils\Helper::url_generate($cancel_url, $url_cancel);


		// return success action..
		if (in_array($type, ['success', 'cancel'])) {


			$status = get_post_meta($this->entry_id, $this->key_payment_status, true);

			if ($status == 'processing') {
				$token_dat = isset($_GET['token']) ? $_GET['token']  : '';
				$invoice = get_post_meta($this->entry_id, $this->key_payment_invoice, true);
				if ($token_dat == $invoice) {
					$payment_status = 'success';
					update_post_meta($this->entry_id, $this->key_payment_status, $payment_status);
				}
				if ($invoice == $token_dat && $type == 'cancel') {
					$payment_status = 'failed';
					update_post_meta($this->entry_id, $this->key_payment_status, $payment_status);
				}
			}

			$settings = \MetForm\Core\Admin\Base::instance()->get_settings_option();

			$thank_you_page = !empty($settings['mf_thank_you_page']) ? get_page_link($settings['mf_thank_you_page']) . '?id=' . $this->entry_id : '';
			$mf_cancel_page = !empty($settings['mf_cancel_page']) ? get_page_link($settings['mf_cancel_page']) . '?id=' . $this->entry_id : '';

			if($payment_status === 'success' && !empty($thank_you_page)){
				$redirect_url = $thank_you_page;
			} else if($payment_status === 'failed' && !empty($mf_cancel_page)){
				$redirect_url = $mf_cancel_page;
			} else {
				$redirect_url = $this->mf_request_page_url . '?paypal_payment_status=' . $payment_status;
			}

			if (wp_redirect($redirect_url)) {
				exit;
			}
			return '';
		}

		// check payment status
		if ($this->payment_status == 'paid') {
			return esc_html__('Already has been payment received.', 'metform-pro');
		}

		// check payment method enable
		if (!$this->form_settings['mf_paypal']) {
			return esc_html__('Please enable payment method to form settings.', 'metform-pro');
		}

		// check paypal email
		$paypal_email = isset($this->form_settings['mf_paypal_email']) ? $this->form_settings['mf_paypal_email'] : '';
		if (empty(trim($paypal_email)) || !filter_var($paypal_email, FILTER_VALIDATE_EMAIL)) {
			return esc_html__('Enter your valid paypal email to form settings', 'metform-pro');
		}


		$widget = is_array($this->payment_input_name) ? current($this->payment_input_name) : '';

		$amount_filed = isset($this->map_data[$widget]->mf_input_payment_field_name) ? $this->map_data[$widget]->mf_input_payment_field_name : '';

		$amount = isset($this->form_data[$amount_filed]) ? $this->form_data[$amount_filed] : 0;
		if (empty($amount) || $amount == 0) {
			return esc_html__('Please set amount', 'metform-pro');
		}

		$currency = $this->form_settings['mf_payment_currency'] ?? 'USD';

		// get token data
		$token = isset($this->form_settings['mf_paypal_token']) ? $this->form_settings['mf_paypal_token'] : '';

		$textShuffle = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		$invoiceToken = substr(str_shuffle($textShuffle), 0, 6) . '-' . time();
		$invoice_prefix = 'met-';

		$item_name = 'Item name';

		$dataUrl['cmd'] = '_xclick';
		$dataUrl['business'] = $paypal_email;
		$dataUrl['item_name'] = $item_name;
		$dataUrl['item_number'] = $this->entry_id;
		$dataUrl['tx'] =  $invoice_prefix . $invoiceToken;
		$dataUrl['custom'] = 'RESDONE-' . $this->form_id;
		$dataUrl['amount'] = $amount;
		$dataUrl['quantity'] = 1;
		$dataUrl['no_shipping'] = 0;
		$dataUrl['payer_email'] = (isset($this->email_user) ? $this->email_user : null);
		$dataUrl['no_note'] = 1;
		$dataUrl['currency_code'] = $currency;


		if (empty(trim($first_name))) {
			$dataUrl['first_name'] = $first_name;
		}
		if (empty(trim($last_name))) {
			$dataUrl['last_name'] = $last_name;
		}
		if (!empty(trim($token))) {
			$dataUrl['at'] = $token;
		}

		$rest_url = get_rest_url(null, 'metform/v1/entries/');
		$success_url_rest = $rest_url . "paypal/success?entry_id=" . $this->entry_id . '&token=' . $invoiceToken;
		$cancel_url_rest = $rest_url . "paypal/cancel?entry_id=" . $this->entry_id . '&token=' . $invoiceToken;

		$dataUrl['return'] = $success_url_rest;
		$dataUrl['cancel_return'] = $cancel_url_rest;

		$notify_url_rest     = add_query_arg(array(
			'action'   => 'metforms-paypal-ipn',
			'form_id'  => $this->form_id,
			'entry_id' => $this->entry_id,
		), admin_url('admin-ajax.php'));

		$dataUrl['notify_url'] = $notify_url_rest;

		// set paypal url
		$url = 'https://www.paypal.com/cgi-bin/webscr?';
		if ($this->form_settings['mf_paypal_sandbox']) {
			$url = 'https://www.sandbox.paypal.com/cgi-bin/webscr?';
		}
		$url = \MetForm_Pro\Utils\Helper::url_generate($url, $dataUrl);

		if (wp_redirect($url)) {
			update_post_meta($this->entry_id, $this->key_payment_invoice, $invoiceToken);
			update_post_meta($this->entry_id, $this->key_payment_status, 'processing');
			exit;
		}

		return '';
	}

	public static function instance()
	{
		if (!self::$instance) {
			self::$instance = new self();
		}
		return self::$instance;
	}
}
