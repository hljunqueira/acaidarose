<?php

namespace MetForm_Pro\Core\Integrations\Payment;

defined('ABSPATH') || exit;

defined('ABSPATH') || exit;

class Stripe
{
    use \MetForm\Traits\Singleton;

    private static $instance;

    private $live_keys = null;

    private $key_form_id;
    private $key_form_data;
    private $key_payment_status;
    private $key_payment_invoice;

    private $entry_id;
    private $form_id;
    private $form_settings;
    private $payment_input_name;
    private $payment_status;
    private $map_data;
	private $payment_first_name;
	private $payment_last_name;

    public function __construct()
    {
        $this->key_form_id = 'metform_entries__form_id';
        $this->key_form_data = 'metform_entries__form_data';
        //$this->key_form_settings = 'metform_form__form_setting';
        $this->key_payment_status = 'metform_entries__payment_status';
        $this->key_payment_invoice = 'metform_entries__payment_invoice';
    }

    public function init(array $args)
    {

        $this->entry_id = $args['entry_id'];

        $type = $args['action'];

        $token = isset($args['token']) ? $args['token'] : '';
        if (empty($token)) {
            return esc_html__('Invalid payment token.', 'metform-pro');
        }

        $this->form_data = get_post_meta($this->entry_id, $this->key_form_data, true);

        $this->form_id = get_post_meta($this->entry_id, $this->key_form_id, true);

        $this->payment_status = get_post_meta($this->entry_id, $this->key_payment_status, true);

        $this->map_data = '';
        $this->payment_input_name = '';
        $this->payment_first_name = '';
        $this->payment_last_name = '';

        // metform loaded
        if (did_action('metform/after_load')) {
            $this->form_settings = \MetForm\Core\Forms\Action::instance()->get_all_data($this->form_id);
            $this->map_data = \MetForm\Core\Entries\Action::instance()->get_fields($this->form_id);
            $this->payment_input_name = \MetForm\Core\Entries\Action::instance()->get_input_name_by_widget_type('mf-payment-method', $this->map_data);
            $this->payment_first_name = \MetForm\Core\Entries\Action::instance()->get_input_name_by_widget_type('mf-listing-fname', $this->map_data);
            $this->payment_last_name = \MetForm\Core\Entries\Action::instance()->get_input_name_by_widget_type('mf-listing-lname', $this->map_data);
        }

        // check payment status
        if ($this->payment_status == 'paid') {
            return esc_html__('Already has been payment received.', 'metform-pro');
        }

        // check payment method enable
        if (!$this->form_settings['mf_stripe']) {
            return esc_html__('Please enable payment method to form settings.', 'metform-pro');
        }

        $widget = is_array($this->payment_input_name) ? current($this->payment_input_name) : '';

        $amount_filed = isset($this->map_data[$widget]->mf_input_payment_field_name) ? $this->map_data[$widget]->mf_input_payment_field_name : '';

        $amount = isset($this->form_data[$amount_filed]) ? $this->form_data[$amount_filed] : 0;
        if (empty($amount) || $amount == 0) {
            return esc_html__('Please set amount filed in payment widget.', 'metform-pro');
        }
        $amount = $amount * 100;

        // set key for check payment
        $livekey = isset($this->form_settings['mf_stripe_live_secret_key']) ? $this->form_settings['mf_stripe_live_secret_key'] : '';
        $livekey_test = isset($this->form_settings['mf_stripe_test_secret_key']) ? $this->form_settings['mf_stripe_test_secret_key'] : '';
        $sandbox = isset($this->form_settings['mf_stripe_sandbox']) ? true : false;

        $this->live_keys = ($sandbox) ? $livekey_test : $livekey;
        if (empty($this->live_keys)  || strlen($this->live_keys) < 6) {
            return esc_html__('Please set Stripe Secret Keys.', 'metform-pro');
        }

	    $currency = $this->form_settings['mf_payment_currency'] ?? 'USD';
	    $config['token'] = $token;
        $config['amount'] = $amount;
        $config['currency'] = $currency;
        $res = $this->stripe_verify($config);

        // success URl
        $success_url = get_site_url() . '/';
        if (isset($this->form_settings['success_url']) && filter_var($this->form_settings['success_url'], FILTER_VALIDATE_URL)) {
            $success_url = $this->form_settings['success_url'];
        }
        $url_success = [];
        $url_success['entry_id'] = $this->entry_id;
        $success_url = \MetForm_Pro\Utils\Helper::url_generate($success_url, $url_success);


        $settings = \MetForm\Core\Admin\Base::instance()->get_settings_option();

        if ($res['status']) {
            $txn_id = !empty($res['get']['invoice']) ? $res['get']['invoice'] : $res['get']['balance_transaction'];
            update_post_meta($this->entry_id, 'metform_entries__payment_trans', $txn_id);
            update_post_meta($this->entry_id, 'metform_entries__payment_trans_data', serialize($res['get']));
            update_post_meta($this->entry_id, 'metform_entries__payment_status', 'paid');

            if(isset($settings['mf_thank_you_page']) && !empty($settings['mf_thank_you_page'])){
                $redirect_url = get_page_link($settings['mf_thank_you_page']) . '?id=' . $this->entry_id;
            } else {
                $redirect_url = '';
            }
            

            return [
                'status' => 'success',
                'message' => esc_html__('Successfully payment received.', 'metform-pro'),
                'redirect_url' =>  $redirect_url,
                'data' => $res['get'],


            ];
        } else {

            // cancel URl
            if(isset($settings['mf_cancel_page']) && !empty($settings['mf_cancel_page'])){
                $cancel_url = get_page_link($settings['mf_cancel_page']) . '?id=' . $this->entry_id;
            } else {
                $cancel_url = '';
            }
            return [
                'status' => 'faild',
                'message' => $res['get'],
                'redirect_url' =>  $cancel_url,
            ];
        }
    }


    public function stripe_verify($config)
    {
        require_once __DIR__ . '/stripe-php/init.php';

        $token = isset($config['token']) ? $config['token'] : '';
        $amount_cent = isset($config['amount']) ? $config['amount'] : 0;
        $currency = isset($config['currency']) ? $config['currency'] : 'USD';
        try {
            \Stripe\Stripe::setApiKey($this->live_keys);
            $charge = \Stripe\Charge::create(array('amount' => $amount_cent, 'currency' => $currency, 'source' => $token));
            $payment_data = array(
                'livemode'             => $charge['livemode'],
                'amount'               => $charge['amount'],
                'currency'             => $charge['currency'],
                'paid'                 => $charge['paid'],
                'status'               => $charge['status'],
                'receipt_email'        => $charge['receipt_email'],
                'receipt_number'       => $charge['receipt_number'],
                'refunded'             => $charge['refunded'],
                'amount_refunded'      => $charge['amount_refunded'],
                'application_fee'      => $charge['application_fee'],
                'balance_transaction'  => $charge['balance_transaction'],
                'captured'             => $charge['captured'],
                'created'              => $charge['created'],
                'customer'             => $charge['customer'],
                'description'          => $charge['description'],
                'destination'          => $charge['destination'],
                'dispute'              => $charge['dispute'],
                'failure_code'         => $charge['failure_code'],
                'failure_message'      => $charge['failure_message'],
                'fraud_details'        => $charge['fraud_details'],
                'invoice'              => $charge['invoice'],
                'order'                => $charge['order'],
                'shipping'             => $charge['shipping'],
                'source_transfer'      => $charge['source_transfer'],
                'statement_descriptor' => $charge['statement_descriptor'],
            );

            return ['status' => true, 'get' => $payment_data];
        } catch (\Exception $e) {
            return ['status' => false, 'get' => $e->getMessage()];
        }
        return ['status' => false, 'get' => ''];
    }

    public static function instance()
    {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
}
