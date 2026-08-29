<?php
namespace MetForm_Pro\Widgets;

use MetForm\Core\Entries\Action;
use MetForm_Pro\Core\Integrations\Google_Sheet\WF_Google_Sheet;

defined( 'ABSPATH' ) || exit;

Class Manifest{
    use \MetForm\Traits\Singleton;

	public function init(){

		add_action( 'elementor/elements/categories_registered', [ $this, 'add_metform_pro_widget_categories' ]);

		add_action( 'elementor/widgets/register', [ $this, 'register_widgets' ] );

		add_filter('metform/onload/input_widgets', [ $this, 'filter_input_widget']);

		add_action( 'elementor/editor/after_save', [$this, 'google_sheet_update']);
	}

	public function filter_input_widget($widgets){

		$pro_widgets = [
			'mf-mobile',
			'mf-calculation',
			'mf-image-select',
			'mf-toggle-select',
			'mf-simple-repeater',
			'mf-map-location',
			'mf-color-picker',
			'mf-payment-method',
			'mf-signature',
			'mf-like-dislike',
			'mf-credit-card',
			'mf-text-editor',
		];

		return array_merge($widgets, $pro_widgets);
	}

	public function includes(){

		require_once plugin_dir_path(__FILE__) . 'mobile/mobile.php';
		require_once plugin_dir_path(__FILE__) . 'calculation/calculation.php';
		require_once plugin_dir_path(__FILE__) . 'image-select/image-select.php';
		require_once plugin_dir_path(__FILE__) . 'toggle-select/toggle-select.php';
		require_once plugin_dir_path(__FILE__) . 'simple-repeater/simple-repeater.php';
		require_once plugin_dir_path(__FILE__) . 'map-location/map-location.php';
		require_once plugin_dir_path(__FILE__) . 'color-picker/color-picker.php';
		require_once plugin_dir_path(__FILE__) . 'payment-method/payment-method.php';
		require_once plugin_dir_path(__FILE__) . 'next-step/next-step.php';
		require_once plugin_dir_path(__FILE__) . 'prev-step/prev-step.php';
		require_once plugin_dir_path(__FILE__) . 'progress-step/progress-step.php';
		require_once plugin_dir_path(__FILE__) . 'signature/signature.php';
		require_once plugin_dir_path(__FILE__) . 'like-dislike/like-dislike.php';
		require_once plugin_dir_path(__FILE__) . 'credit-card/credit-card.php';
		require_once plugin_dir_path(__FILE__) . 'text-editor/text-editor.php';
	}

	public function register_widgets() {

		$this->includes();

		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Mobile() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Calculation() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Image_Select() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Toggle_Select() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Simple_Repeater() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Map_Location() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Color_Picker() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Payment_Method() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Next_Step() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Prev_Step() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Signature() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Like_Dislike() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Input_Credit_Card() );
		// \Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Progress_Step() );
		\Elementor\Plugin::instance()->widgets_manager->register( new \Elementor\MetForm_Text_Editor() );
	}

	public function add_metform_pro_widget_categories( $elements_manager ) {

		$elements_manager->add_category(
			'metform-pro',
			[
				'title' => esc_html__( 'Metform Pro', 'metform-pro' ),
				'icon' => 'fa fa-plug',
			]
		);
	}

	public function google_sheet_update($post_id) {
		$google_sheet_id_name = 'wf_google_sheet_'.$post_id;
		$google_sheet_id = get_option($google_sheet_id_name);
		if($google_sheet_id) {
			$action = Action::instance();
			$from_fields = $action->get_fields($post_id);
			$google = WF_Google_Sheet::instance();
			$names = $google->update_names($post_id, $from_fields);
			$google->insert_names($google_sheet_id, $names);
		}
	}

}

