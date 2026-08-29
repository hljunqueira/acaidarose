<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Input_Calculation extends Widget_Base{

	use \MetForm\Traits\Common_Controls;
	use \MetForm\Traits\Conditional_Controls;

    public function get_name() {
		return 'mf-calculation';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_calculation_field';
	}

	public function get_title() {
		return esc_html__( 'Calculation', 'metform-pro' );
	}

	public function has_widget_inner_wrapper(): bool {
		return ! Plugin::$instance->experiments->is_feature_active('e_optimized_markup');
	}

	public function show_in_panel() {
        return 'metform-form' == get_post_type();
	}

	public function get_categories() {
		return [ 'metform-pro' ];
	}

	public function get_keywords() {
        return ['metform-pro', 'input', 'calculation'];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list/#calculation';
    }

    protected function register_controls() {

        $this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'Content', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);
		
		$this->input_content_controls(['NO_PLACEHOLDER']);

		$this->add_control(
            'mf_input_calculation_equation_prefix',
            [
                'label' => esc_html__('Prefix:', 'metform-pro'),
                'type' => Controls_Manager::TEXT,
				'description' => esc_html__( 'You can use prefix before the calculation total.', 'metform-pro' ),
				'separator'	=> 'before'
            ]
		);

		$this->add_responsive_control(
            'mf_field_input_spacing',
            [
                'label' => esc_html__( 'Prefix Input Spacing', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%'],
                'range' => [
                    '%' => [
                        'min' => 0,
                        'max' => 100,
                    ],
				],
				'default'	=> [
					'size'	=> 5,
					'unit'	=> 'px'
				],
                'selectors' => [
                    '{{WRAPPER}} .mf-input-calculation-total:before' => 'margin-right: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'mf_input_calculation_equation_prefix!' => '',
				],
				'separator'	=> 'after'
            ]
		);

		$this->add_control(
            'mf_input_calculation_equation_suffix',
            [
                'label' => esc_html__('Suffix:', 'metform-pro'),
                'type' => Controls_Manager::TEXT,
				'description' => esc_html__( 'You can use suffix before the calculation total.', 'metform-pro' ),
				'separator'	=> 'before'
            ]
		);

		$this->add_responsive_control(
            'mf_field_input_spacing_suffix',
            [
                'label' => esc_html__( 'Suffix Input Spacing', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%'],
                'range' => [
                    '%' => [
                        'min' => 0,
                        'max' => 100,
                    ],
				],
				'default'	=> [
					'size'	=> 5,
					'unit'	=> 'px'
				],
                'selectors' => [
                    '{{WRAPPER}} .mf-input-calculation-total:after' => 'margin-left: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'mf_input_calculation_equation_suffix!' => '',
				],
				'separator'	=> 'after'
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
			'settings_section',
			[
				'label' => esc_html__( 'Settings', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);

        $this->input_setting_controls();

		$this->add_control(
			'mf_input_validation_type',
			[
				'label' => __( 'Validation Type', 'metform-pro' ),
				'type' => \Elementor\Controls_Manager::HIDDEN,
				'default' => 'none',
			]
		);

        $this->add_control(
            'mf_input_calculation_equation',
            [
                'label' => esc_html__('Expression with operators and inputs ', 'metform-pro'),
                'type' => Controls_Manager::TEXTAREA,
                'rows' => 5,
				'placeholder' => esc_html__( 'Ex: number_1 * number_2', 'metform-pro' ),
				'description' => esc_html__( 'You have to make calculation logic by name of input fields. Use name of input field and make calculation logic by it.', 'metform-pro' ),
            ]
		);

		$this->add_control(
			'disable_fraction_dight',
			[
				'label' => esc_html__( 'Disable Fraction Digits', 'metform-pro' ),
				'type' => Controls_Manager::SWITCHER,
				'label_on' => esc_html__( 'Yes', 'metform-pro' ),
				'label_off' => esc_html__( 'No', 'metform-pro' ),
				'return_value' => 'yes',
				'default' => 'no',

			]
		);

		$this->add_control(
			'max_fraction_dight',
			[
				'label' => esc_html__( 'Maximum Fraction Digits', 'metform-pro' ),
				'type' => Controls_Manager::NUMBER,
				'default' => 2,
				'min' => 0,
				'max' => 100,
				'condition' => [
					'disable_fraction_dight' => ['no', ''],
				],
			]
		);

		$this->add_control(
			'min_fraction_dight',
			[
				'label' => esc_html__( 'Minimum Fraction Digits', 'metform-pro' ),
				'type' => Controls_Manager::NUMBER,
				'default' => 0,
				'min' => 0,
				'max' => 100,
				'condition' => [
					'disable_fraction_dight' => ['no', ''],
				],
			]
		);

        $this->add_control(
            'comma_separator_enable',
            [
                'label' => __( 'Comma Enable', 'metform-pro' ),
				'description' => esc_html__( 'Enable if you want comma in the calculation total (ex.10,000,000)', 'metform-pro' ),
                'type' => 	Controls_Manager::SWITCHER,
                'label_on' => __( 'Yes', 'metform-pro' ),
                'label_off' => __( 'No', 'metform-pro' ),
                'return_value' => 'yes',
                'default' => 'no',
            ]
        );
		$this->end_controls_section();

		if(class_exists('\MetForm_Pro\Base\Package')){
			$this->input_conditional_control();
		}

        $this->start_controls_section(
			'label_section',
			[
				'label' => esc_html__( 'Label', 'metform-pro' ),
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
				'label' => esc_html__( 'Input', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
        );

		$this->add_responsive_control(
			'mf_input_alignment',
			[
				'label' => esc_html__( 'Alignment', 'metform-pro' ),
				'type' => \Elementor\Controls_Manager::CHOOSE,
				'options' => [
					'left' => [
						'title' => __( 'Left', 'metform-pro' ),
						'icon' => 'fa fa-align-left',
					],
					'center' => [
						'title' => __( 'Center', 'metform-pro' ),
						'icon' => 'fa fa-align-center',
					],
					'right' => [
						'title' => __( 'Right', 'metform-pro' ),
						'icon' => 'fa fa-align-right',
					],
				],
				'default' => 'left',
				'toggle' => true,
				'selectors' => [
					'{{WRAPPER}} .mf-input-calculation-total' => 'text-align: {{VALUE}};',
				],
			]
		);

        $this->input_controls();

        $this->end_controls_section();

        $this->start_controls_section(
			'help_text_section',
			[
				'label' => esc_html__( 'Help Text', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'mf_input_help_text!' => ''
				]
			]
		);

		$this->input_help_text_controls();

        $this->end_controls_section();

        /**
         * *********************************
         * WooCommerce Checkout integration
         * *********************************
         *
         * About :
         * This feature will help user to checkout any kind of amount
         * from Metform
         * Here is the settings section for the feature.
         */
        $this->start_controls_section(
            'mf_woocommerce',
            [
                'label' => esc_html__( 'WooCommerce Checkout', 'metform-pro' ),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'mf_woo_checkout_enable',
            [
                'label' => __( 'Enable', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __( 'Enable', 'metform-pro' ),
                'label_off' => __( 'Disable', 'metform-pro' ),
                'return_value' => 'yes',
                'default' => 'no',
            ]
        );

        $this->add_control('mf_woo_checkout_title',[

            'label' => __('Title','metform-pro'),
            'type'  => Controls_Manager::TEXT,
            'placeholder' => __('Item title','metform-pro'),
            'condition' => [
                'mf_woo_checkout_enable' => 'yes',
            ]
        ]);

        $this->add_control('mf_woo_checkout_details',[
            'label' => __('Details', 'metform-pro'),
            'type' => Controls_Manager::TEXTAREA,
            'placeholder' => 'Item details',
            'condition' => [
                'mf_woo_checkout_enable' => 'yes',
            ]
        ]);



        $this->end_controls_section();


	}
	
    protected function render($instance = []){
		$settings = $this->get_settings_for_display();
		extract($settings);

		$render_on_editor = false;
		$is_edit_mode = 'metform-form' === get_post_type() && \Elementor\Plugin::$instance->editor->is_edit_mode();

		$mf_input_calculation_equation = isset($mf_input_calculation_equation) ? $mf_input_calculation_equation : '';
		$fraction_dight = isset($mf_input_calculation_equation) ? $mf_input_calculation_equation : '';

		$class = (isset($settings['mf_conditional_logic_form_list']) ? 'mf-conditional-input' : '');

		$configData = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : esc_html__('This field is required.', 'metform-pro') : esc_html__('This field is required.', 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false,
		];
        ?>

        <!--   WooCommerce Checkout fields     -->
        <input type="hidden" name="mf-woo-checkout" ref=${parent.setDefault} value="<?php echo esc_html($settings['mf_woo_checkout_enable'],'metform-pro'); ?>" />
        <input type="hidden" name="mf-woo-checkout-title" ref=${parent.setDefault} value="<?php echo esc_html($settings['mf_woo_checkout_title'],'metform-pro'); ?>" />
        <input type="hidden" name="mf-woo-checkout-details" ref=${parent.setDefault} value="<?php echo esc_html($settings['mf_woo_checkout_details'],'metform-pro'); ?>" />
        <input type="hidden" name="mf-woo-checkout-calculation-field" ref=${parent.setDefault} value="<?php echo esc_html($mf_input_name,'metform-pro'); ?>" />


        <div class="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label class="mf-input-label" for="mf-input-calculation-<?php echo esc_attr( $this->get_id() ); ?>">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span class="mf-input-required-indicator"><?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?></span>
				</label>
			<?php endif; ?>

			<input
				data-fraction-min="<?php echo esc_attr($min_fraction_dight) ?>" 
                data-fraction="<?php echo esc_attr($max_fraction_dight) ?>"
				data-fraction-disable="<?php echo esc_attr($disable_fraction_dight) ?>"
                type="hidden"
				data-comma="<?php echo esc_attr($comma_separator_enable) ?>"
                class="mf-input mf-input-calculation <?php echo $class; ?>"
                name="<?php echo esc_attr($mf_input_name); ?>"
                id="mf-input-calculation-<?php echo esc_attr($this->get_id()); ?>"
                data-equation="<?php echo esc_attr($mf_input_calculation_equation); ?>"
                <?php echo esc_attr(($mf_input_required === 'yes') ? 'required' : '')?>
                <?php if ( !$is_edit_mode ): ?>
                    value=${ parent.state.formData['<?php echo esc_attr($mf_input_name); ?>'] || '' }
                    onInput=${ parent.handleChange }
                    aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>'] ? 'true' : 'false'}
                    ref=${ el => parent.activateValidation(<?php echo json_encode($configData); ?>, el) }
                <?php endif; ?>
            />
			<span class="mf-input-calculation-total" data-prefix="<?php echo !empty($mf_input_calculation_equation_prefix) ? $mf_input_calculation_equation_prefix : '' ?>" data-suffix="<?php echo !empty($mf_input_calculation_equation_suffix) ? $mf_input_calculation_equation_suffix : '' ?>"><?php echo $is_edit_mode ? 0 : '${ parent.state.formData["'. esc_attr( $mf_input_name ) .'"] || 0 }'; ?></span>

			<?php if ( !$is_edit_mode ) : ?>
				<${validation.ErrorMessage}
					errors=${validation.errors}
					name="<?php echo esc_attr( $mf_input_name ); ?>"
					as=${html`<span className="mf-error-message"></span>`}
					/>
			<?php endif; ?>

			<?php echo '' != $mf_input_help_text ? '<span class="mf-input-help">'. \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_help_text), $render_on_editor ) .'</span>' : ''; ?>
		</div>

		<?php
    }
}
