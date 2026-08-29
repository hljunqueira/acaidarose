<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Input_Payment_Method extends Widget_Base{

	use \MetForm\Traits\Common_Controls;
	use \MetForm\Traits\Conditional_Controls;

    public function __construct( $data = [], $args = null ) {
		parent::__construct( $data, $args );
	}
	public function get_script_depends() {
		return [ 'stripe-checkout' ];
	}
    public function get_name() {
		return 'mf-payment-method';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_payment_method';
	}

	public function get_title() {
		return esc_html__( 'Payment method', 'metform-pro' );
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
        return ['metform-pro', 'input', 'payment', 'payment method', 'pay'];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list/#payment-method-';
    }

    protected function register_controls() {

        $this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'Content', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'mf_input_label_status',
			[
				'label' => esc_html__( 'Show Label', 'metform-pro' ),
				'type' => Controls_Manager::SWITCHER,
				'on' => esc_html__( 'Show', 'metform-pro' ),
				'off' => esc_html__( 'Hide', 'metform-pro' ),
				'return_value' => 'yes',
				'default' => 'yes',
				'description' => esc_html__('for adding label on input turn it on. Don\'t want to use label? turn it off.', 'metform-pro'),
			]
		);

		$this->add_control(
			'mf_input_label_display_property',
			[
				'label' => esc_html__( 'Position', 'metform-pro' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'block',
				'options' => [
					'block' => esc_html__( 'Top', 'metform-pro' ),
					'inline-block' => esc_html__( 'Left', 'metform-pro' ),
                ],
                'selectors' => [
					'{{WRAPPER}} .mf-input-label' => 'display: {{VALUE}};',
					'{{WRAPPER}} .mf-payment-method' => 'display: inline-block',
				],
				'condition'    => [
                    'mf_input_label_status' => 'yes',
				],
				'description' => esc_html__('Select label position. where you want to see it. top of the input or left of the input.', 'metform-pro'),

			]
		);

        $this->add_control(
			'mf_input_label',
			[
				'label' => esc_html__( 'Input Label:', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
				'default' => $this->get_title(),
				'title' => esc_html__( 'Enter here label of input', 'metform-pro' ),
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
		);

		$this->add_control(
			'mf_input_name',
			[
				'label' => esc_html__( 'Name', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
				'default' => $this->get_name(),
				'title' => esc_html__( 'Enter here name of the input', 'metform-pro' ),
				'description' => esc_html__('Name is must required. Enter name without space or any special character. use only underscore/ hyphen (_/-) for multiple word. Name must be different.', 'metform-pro'),
				'frontend_available'	=> true
			]
		);

		$this->add_control(
			'mf_input_display_option',
			[
				'label' => esc_html__( 'Option Display : ', 'metform-pro' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'solid',
				'options' => [
					'inline-block'  => esc_html__( 'Horizontal', 'metform-pro' ),
					'block' => esc_html__( 'Vertical', 'metform-pro' ),
                ],
                'default' => 'inline-block',
                'selectors' => [
                    '{{WRAPPER}} .mf-payment-method-option' => 'display: {{VALUE}};',
				],
				'description' => esc_html__('Image select option display style.', 'metform-pro'),
			]
        );

        $this->add_control(
			'mf_input_payment_method_options',
			[
				'label' =>esc_html__( 'Payment methods', 'metform-pro' ),
				'type' => Controls_Manager::SELECT2,
				'multiple' => true,
				'options' => [
					'paypal'  => __( 'Paypal', 'metform-pro' ),
					'stripe' => __( 'Stripe', 'metform-pro' ),
				],
				'default' => [ 'paypal' ],
			]
		);
		

        $this->add_control(
			'mf_input_payment_method_default_options',
			[
				'label' =>esc_html__( 'Default payment method', 'metform-pro' ),
				'type' => Controls_Manager::SELECT,
				'options' => [
					'paypal'  => __( 'Paypal', 'metform-pro' ),
					'stripe' => __( 'Stripe', 'metform-pro' ),
				],
				'default' => 'paypal',
			]
		);

		$this->add_control(
			'mf_input_payment_heading',
			[
				'label' =>esc_html__( 'Integrate Field', 'metform-pro' ),
				'type' => Controls_Manager::HEADING,
				'separator' => 'before',
			]
		);

		$this->add_control(
            'mf_input_payment_field_name', [
                'label' => esc_html__( 'Field Name', 'metform-pro' ),
                'type' => Controls_Manager::TEXT,
                'placeholder' => esc_html__( 'mf-sample' , 'metform-pro' ),
                'label_block' => true,
                'description' => esc_html__('Set amount field for payment.', 'metform-pro'),
            ]
		);

		$this->add_control(
			'mf_input_help_text',
			[
				'label' => esc_html__( 'Help Text : ', 'metform-pro' ),
				'type' => Controls_Manager::TEXTAREA,
				'rows' => 3,
				'placeholder' => esc_html__( 'Type your help text here', 'metform-pro' ),
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

		$this->input_get_params_controls();

		$this->end_controls_section();

		if(class_exists('\MetForm_Pro\Base\Package')){
			$this->input_conditional_control();
		}

        $this->start_controls_section(
			'label_section',
			[
				'label' => esc_html__( 'Input Label', 'metform-pro' ),
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

		$this->add_control(
			'mf_input_label_width',
			[
				'label' => esc_html__( 'Width', 'metform-pro' ),
				'type' => Controls_Manager::SLIDER,
				'size_units' => [ 'px' ],
				'range' => [
					'px' => [
						'min' => 0,
						'max' => 1000,
						'step' => 5,
					]
				],
				'default' => [
					'unit' => '%',
					'size' => 20,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-input-label' => 'width: {{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .mf-payment-method' => 'width: calc(100% - {{SIZE}}{{UNIT}} - 7px) !important',
				],
				'condition'    => [
                    'mf_input_label_display_property' => 'inline-block',
                ],
			]
		);

		$this->add_control(
			'mf_input_label_color',
			[
                'label' => esc_html__( 'Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-input-label' => 'color: {{VALUE}}',
				],
				'default' => '#000000',
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
		);
		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_input_label_typography',
				'label' => esc_html__( 'Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-input-label',
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
		);
		$this->add_responsive_control(
			'mf_input_label_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-input-label' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
		);
		$this->add_responsive_control(
			'mf_input_label_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-input-label' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
		);

		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name' => 'mf_input_label_box_shadow',
				'label' => esc_html__( 'Box Shadow', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-input-label',
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
		);

		
		$this->add_control(
			'mf_input_required_indicator_color',
			[
				'label' => esc_html__( 'Required Indicator Color:', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'default' => '#f00',
				'selectors' => [
					'{{WRAPPER}} .mf-input-required-indicator' => 'color: {{VALUE}}',
				],
				'condition'    => [
                    'mf_input_required' => 'yes',
                ],
			]
		);

		$this->add_control(
			'mf_input_warning_text_color',
			[
				'label' => esc_html__( 'Warning Text Color:', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'default' => '#f00',
				'selectors' => [
					'{{WRAPPER}} .mf-error-message' => 'color: {{VALUE}}'
				],
				'condition'    => [
                    'mf_input_required' => 'yes',
                ],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_input_warning_text_typography',
				'label' => esc_html__( 'Warning Text Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-error-message',
				'condition'    => [
                    'mf_input_required' => 'yes',
                ],
			]
		);
		
        $this->end_controls_section();

        $this->start_controls_section(
            'image_option_section',
            [
                'label' => esc_html__('Image', 'metform-pro'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
			'mf_input_option_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-payment-method-option img' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);
		$this->add_responsive_control(
			'mf_input_option_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-payment-method-option img' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_responsive_control(
            'mf_input_option_border_radius',
            [
                'label' =>esc_html__( 'Border Radius', 'metform-pro' ),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px'],
                'default' => [
                    'top' => '',
                    'right' => '',
                    'bottom' => '' ,
                    'left' => '',
                ],
                'selectors' => [
                    '{{WRAPPER}} .mf-payment-method-option img' =>  'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );


		$this->add_responsive_control(
			'mf_input_option_space_between',
			[
				'label' => esc_html__( 'Width', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
					'px' => [
						'min' => 20,
						'max' => 1000,
						'step' => 1,
					],
				],
				'default' => [
                    'unit' => 'px',
                    'size' => 200,
                ],
				'selectors' => [
					'{{WRAPPER}} .mf-input-wrapper .mf-payment-method-option .mf-input, {{WRAPPER}} .mf-payment-method-option .mf-input[type="radio"] + img' => 'width: {{SIZE}}{{UNIT}}',
				]
			]
		);

		$this->start_controls_tabs('mf_input_border_tabs');

		$this->start_controls_tab(
			'mf_input_border_normal_tab',
			[
				'label'	=> esc_html__('Normal', 'metform-pro')
			]
		);
			$this->add_group_control(
				Group_Control_Border::get_type(),
				[
					'name' => 'mf_input_option_normal_image',
					'selector' => '{{WRAPPER}} .mf-payment-method-option input[type="radio"] + img',
					'fields_options' => [
						'border' => [
							'label' =>  esc_html__( 'Border', 'metform-pro' ),
							'default' => 'solid',
						],
						'width' => [
							'default' => [
								'top' => '2',
								'right' => '2',
								'bottom' => '2',
								'left' => '2',
								'isLinked' => true,
							],
						],
						'color' => [
							'default' => '#FFF',
						],
					],
				]
			);
		$this->end_controls_tab();

		$this->start_controls_tab(
			'mf_input_border_selected_tab',
			[
				'label'	=> esc_html__('Selected', 'metform-pro')
			]
		);

			$this->add_group_control(
				Group_Control_Border::get_type(),
				[
					'name' => 'mf_input_option_selected_image',
					'selector' => '{{WRAPPER}} .mf-payment-method-option input[type="radio"]:checked + img',
					'fields_options' => [
						'border' => [
							'label' =>  esc_html__( 'Border', 'metform-pro' ),
							'default' => 'solid',
						],
						'width' => [
							'default' => [
								'top' => '2',
								'right' => '2',
								'bottom' => '2',
								'left' => '2',
								'isLinked' => true,
							],
						],
						'color' => [
							'default' => '#333',
						],
					],
				]
			);

		$this->end_controls_tab();

		$this->end_controls_tabs();

		$this->end_controls_section();


		$this->start_controls_section(
			'mf_input_help_text_section',
			[
				'label' => esc_html__( 'Help Text', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'mf_input_help_text!' => ''
				]
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_input_help_text_typography',
				'label' => esc_html__( 'Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-input-help',
			]
		);

		$this->add_control(
			'mf_input_help_text_color',
			[
				'label' => esc_html__( 'Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-input-help' => 'color: {{VALUE}}',
				],
				'default' => '#939393',
			]
		);

		$this->add_responsive_control(
			'mf_input_help_text_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-input-help' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();


	}

    protected function render($instance = []){
		$settings = $this->get_settings_for_display();
        extract($settings);

		$render_on_editor = false;
		$is_edit_mode = 'metform-form' === get_post_type() && \Elementor\Plugin::$instance->editor->is_edit_mode();

		$class = (isset($settings['mf_conditional_logic_form_list']) ? 'mf-conditional-input' : '');
		?>

		<div class="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label class="mf-input-label mf-payment-method-label" for="mf-input-payment-method-<?php echo esc_attr( $this->get_id() ); ?>">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span class="mf-input-required-indicator"><?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?></span>
				</label>
			<?php endif; ?>

			<div class="mf-payment-method">
				<?php
				foreach($mf_input_payment_method_options as $key => $option){
					?>
					<div class="mf-payment-method-option <?php echo esc_attr($option); ?>">
						<label>
							<input type="radio"
								class="mf-input mf-payment-method-input <?php echo $class; ?>"
								name="<?php echo esc_attr($mf_input_name); ?>"
								value="<?php echo esc_attr($option); ?>"
								id="mf-input-payment-method-<?php echo esc_attr($this->get_id()); ?>_<?php echo esc_attr($option); ?>"
								onInput=${ parent.handleChange }

								<?php if ( !$is_edit_mode ) :
											$errorMessage 	= ( !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : esc_html__('This field is required.', 'metform-pro') );
										$configData = [
											'message' 		=> $errorMessage,
											'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false
										];
									?>
										aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>'] ? 'true' : 'false'}
										ref=${ el => parent.activateValidation(<?php echo json_encode($configData); ?>, el) }
										${!parent.state.formData["<?php echo esc_attr($mf_input_name) ?>"] ? parent.state.formData["<?php echo esc_attr($mf_input_name) ?>"] = "<?php echo $mf_input_payment_method_default_options ?>" : ""}
									<?php endif; ?>

								/>

							<img src="<?php echo esc_url(\MetForm_Pro\Plugin::instance()->public_url().('assets/img/payment-method/'.$option.".png")); ?>" alt="payment-method" />
						</label>
					</div>
					<?php
				}
				?>
			</div>

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
