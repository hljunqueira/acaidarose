<?php

namespace Elementor;

defined('ABSPATH') || exit;

class MetForm_Input_Map_Location extends Widget_Base
{

	use \MetForm\Traits\Common_Controls;
	use \MetForm\Traits\Conditional_Controls;

	public function __construct($data = [], $args = null)
	{
		parent::__construct($data, $args);
		$this->add_script_depends('metform-map-location');
		$this->add_script_depends('maps-api');
	}

	public function get_name()
	{
		return 'mf-map-location';
	}

	public function get_icon()
	{
		return 'mf-widget-icon icon-metform_map_location_picker';
	}

	public function get_title()
	{
		return esc_html__('Google Map Location', 'metform-pro');
	}
	
	public function has_widget_inner_wrapper(): bool {
		return ! Plugin::$instance->experiments->is_feature_active('e_optimized_markup');
	}

	public function show_in_panel()
	{
		return 'metform-form' == get_post_type();
	}

	public function get_categories()
	{
		return ['metform-pro'];
	}

	public function get_keywords()
	{
		return ['metform-pro', 'input', 'map', 'location', 'google', 'autocomplete'];
	}

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list/#google-map-location-';
    }

	protected function register_controls()
	{

		$this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__('Content', 'metform-pro'),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'mf_input_map_api_notice',
			[
				'label' => esc_html__( 'Map API Notice', 'metform-pro' ),
				'type' => Controls_Manager::RAW_HTML,
				'raw' => \MetForm_Pro\Utils\Helper::kses( '<br>You must have to configure Map API from MetForm -> Settings. <a target="__blank" href="'.get_dashboard_url().'admin.php?page=metform-menu-settings'.'">Configure form here</a><br><br>** Please enable <a target="__blank" href="https://console.cloud.google.com/marketplace/product/google/maps-backend.googleapis.com">Maps JavaScript API</a> and <a target="__blank" href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com">Places API</a> from Google Cloud Console to connect your Google Map Location.', 'metform-pro' ),
				'content_classes' => 'mf-input-map-api-notice',
			]
		);

		$this->input_content_controls();

		$this->end_controls_section();

		$this->start_controls_section(
			'settings_section',
			[
				'label' => esc_html__('Settings', 'metform-pro'),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->input_setting_controls(['MAX_MIN']);

		$this->add_control(
			'mf_input_validation_type',
			[
				'label' => __( 'Validation Type', 'metform-pro' ),
				'type' => \Elementor\Controls_Manager::HIDDEN,
				'default' => 'none',
			]
		);

		$this->end_controls_section();

		if (class_exists('\MetForm\Base\Package')) {
			$this->input_conditional_control();
		}

		$this->start_controls_section(
			'label_section',
			[
				'label' => esc_html__('Label', 'metform-pro'),
				'tab' => Controls_Manager::TAB_STYLE,
				'conditions' => [
					'relation' => 'or',
					'terms' => [
						[
							'name' => 'mf_input_label_status',
							'operator' => '===',
							'value' => 'yes',
						],
						[
							'name' => 'mf_input_required',
							'operator' => '===',
							'value' => 'yes',
						],
					],
                ],
			]
		);

		$this->input_label_controls();

		$this->end_controls_section();

		$this->start_controls_section(
			'input_section',
			[
				'label' => esc_html__('Input', 'metform-pro'),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->input_controls();

		$this->end_controls_section();

		$this->start_controls_section(
			'placeholder_section',
			[
				'label' => esc_html__('Place Holder', 'metform-pro'),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->input_place_holder_controls();

		$this->end_controls_section();

		$this->start_controls_section(
			'help_text_section',
			[
				'label' => esc_html__('Help Text', 'metform-pro'),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'mf_input_help_text!' => ''
				]
			]
		);

		$this->input_help_text_controls();

		$this->end_controls_section();
	}

	protected function render($instance = [])
	{
		$settings = $this->get_settings_for_display();
		$inputWrapStart = $inputWrapEnd = '';
		extract($settings);

		$render_on_editor = true;
		$is_edit_mode = 'metform-form' === get_post_type() && \Elementor\Plugin::$instance->editor->is_edit_mode();

		/**
		 * Loads the below markup on 'Editor' view, only when 'metform-form' post type
		 */
		if ( $is_edit_mode ):
			$inputWrapStart = '<div class="mf-form-wrapper"></div><script type="text" class="mf-template">return html`';
			$inputWrapEnd = '`</script>';
		endif;

		$class = (isset($settings['mf_conditional_logic_form_list']) ? 'mf-conditional-input' : '');
		$configData = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : esc_html__('This field is required.', 'metform-pro') : esc_html__('This field is required.', 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false
		];
		?>

		<?php echo $inputWrapStart; ?>

		<div className="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label className="mf-input-label" htmlFor="mf-input-map-<?php echo esc_attr( $this->get_id() ); ?>">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span className="mf-input-required-indicator"><?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?></span>
				</label>
			<?php endif; ?>

			<input
				type="text"
				name="<?php echo esc_attr($mf_input_name); ?>"
				id="mf-input mf-input-map-<?php echo esc_attr($this->get_id()); ?>"
				className="mf-input mf-input-map-location <?php echo $class; ?>"
				placeholder="<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_placeholder), $render_on_editor ); ?>"
				<?php if ( !$is_edit_mode ): ?>
					onInput=${parent.handleChange}
					aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>'] ? 'true' : 'false'}
					ref=${el => parent.activateValidation(<?php echo json_encode($configData); ?>, el)}
				<?php endif; ?>
				/>

			<?php if ( !$is_edit_mode ) : ?>
				<${validation.ErrorMessage}
					errors=${validation.errors}
					name="<?php echo esc_attr( $mf_input_name ); ?>"
					as=${html`<span className="mf-error-message"></span>`}
					/>
			<?php endif; ?>

			<?php echo '' != $mf_input_help_text ? '<span className="mf-input-help">'. \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_help_text), $render_on_editor ) .'</span>' : ''; ?>
		</div>

		<?php echo $inputWrapEnd; ?>

		<?php
    }
}
