<?php
namespace MetForm_Pro\Core\Integrations\Payment;

defined( 'ABSPATH' ) || exit;

class Process {

    function __construct() {
		 add_action( 'wp_ajax_metforms-paypal-ipn', array( $this, 'paypal_ipn_listener') );
         add_action( 'wp_ajax_nopriv_metforms-paypal-ipn', array( $this, 'paypal_ipn_listener') );

         // script for stripe
         add_action( 'wp_enqueue_scripts', [$this, '_script' ] );
	}
	
	 public function paypal_ipn_listener() {
        $form_id       = !empty($_REQUEST['form_id']) ? $_REQUEST['form_id'] : '';
        $entry_id      = !empty($_REQUEST['entry_id']) ? $_REQUEST['entry_id'] : '';

        // metform loaded
        if( did_action( 'metform/after_load' ) ){
            $form_settings = \MetForm\Core\Forms\Action::instance()->get_all_data($form_id);
        }

        $ipn = new Ipn\Paypal_Ipn();

        if($form_settings['mf_paypal_sandbox']){
            $ipn->useSandbox();
        }
        $verified = $ipn->verifyIPN();

        if ( $verified ) {
            update_post_meta( $entry_id, 'metform_entries__payment_trans', $_REQUEST['txn_id']);
            update_post_meta( $entry_id, 'metform_entries__payment_trans_data', serialize( $_REQUEST ) );
            update_post_meta( $entry_id, 'metform_entries__payment_status', 'paid');
        } else {

            error_log( 'Invalid PayPal IPN request: ' . json_encode($_REQUEST) );
        }

        header("HTTP/1.1 200 OK");

        return;
    }

    public function _script(){
		// stripe script
		wp_register_script( 'stripe-checkout', 'https://checkout.stripe.com/checkout.js', array('jquery'), '1.0.0', false);	
	}
}