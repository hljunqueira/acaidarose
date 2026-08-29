<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Input_Credit_card extends Widget_Base{

	use \MetForm\Traits\Common_Controls;
	use \MetForm\Traits\Conditional_Controls;
	use \MetForm\Widgets\Widget_Notice;

    public function get_name() {
		return 'mf-credit-card';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_credit_card_field-1';
	}
    
	public function get_title() {
		return esc_html__( 'Credit Card', 'metform-pro' );
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
        return ['metform-pro', 'input', 'credit', 'card', 'google'];
	}

	public function get_help_url() {
        return 'https://wpmet.com/doc/metform';
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
					'{{WRAPPER}} .mf-credit-card-wrapper > .mf-input-label' => 'display: {{VALUE}}',
					'{{WRAPPER}} .mf-credit-card-wrapper > .mf-card-input-wrapper' => 'display: {{VALUE}}',
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
				'label' => esc_html__( 'Label : ', 'metform-pro' ),
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
				'frontend_available' => true,
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

		$this->input_setting_controls(['VALIDATION']);

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
					'{{WRAPPER}} .mf-credit-card-wrapper > .mf-input-label' => 'width: {{SIZE}}{{UNIT}}',
					'{{WRAPPER}} .mf-credit-card-wrapper > .mf-card-input-wrapper' => 'display: inline-block; width: calc(100% - {{SIZE}}{{UNIT}} - 7px)',
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
					'{{WRAPPER}} .mf-input-wrapper .mf-input[aria-invalid="true"], {{WRAPPER}} .mf-input-wrapper .mf-input.mf-invalid' => 'border-color: {{VALUE}}',
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
			]
		);

        $this->end_controls_section();

        $this->start_controls_section(
			'input_section',
			[
				'label' => esc_html__( 'Input', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
        );

        
		$this->add_responsive_control(
			'mf_input_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} :not(.mf-card-number-wrapper) .mf-input' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					'{{WRAPPER}} .mf-card-number-wrapper .mf-input' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} calc(56px + {{LEFT}}{{UNIT}});',
					'{{WRAPPER}} .mf-card-number-wrapper .mf-card-number-icon' => 'padding: {{TOP}}{{UNIT}} 0 {{BOTTOM}}{{UNIT}} 0;',
				],
			]
		);

		$this->add_responsive_control(
			'mf_input_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-input' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					'{{WRAPPER}} .mf-card-number-icon' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->start_controls_tabs( 'mf_input_tabs_style' );

		$this->start_controls_tab(
			'mf_input_tabnormal',
			[
				'label' =>esc_html__( 'Normal', 'metform-pro' ),
			]
		);

		$this->add_control(
			'mf_input_color',
			[
				'label' => esc_html__( 'Input Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-input'	=> 'color: {{VALUE}}',
				],
				'default' => '#000000',
			]
		);

		$this->add_group_control(
			Group_Control_Background::get_type(),
			[
				'name' => 'mf_input_background',
				'label' => esc_html__( 'Background', 'metform-pro' ),
				'types' => [ 'classic', 'gradient' ],
				'selector' => '{{WRAPPER}} .mf-input',
			]
		);
		
		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_input_border',
				'label' => esc_html__( 'Border', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-input',
			]
		);


		$this->end_controls_tab();

		$this->start_controls_tab(
			'mf_input_tabhover',
			[
				'label' =>esc_html__( 'Hover', 'metform-pro' ),
			]
		);

		$this->add_control(
			'mf_input_color_hover',
			[
				'label' => esc_html__( 'Input Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-input:hover' => 'color: {{VALUE}}',
				],
				'default' => '#000000',
			]
		);

		$this->add_group_control(
			Group_Control_Background::get_type(),
			[
				'name' => 'mf_input_background_hover',
				'label' => esc_html__( 'Background', 'metform-pro' ),
				'types' => [ 'classic', 'gradient' ],
				'selector' => '{{WRAPPER}} .mf-input:hover',
			]
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_input_border_hover',
				'label' => esc_html__( 'Border', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-input:hover',
			]
		);



		$this->end_controls_tab();

		$this->start_controls_tab(
			'mf_input_tabfocus',
			[
				'label' =>esc_html__( 'Focus', 'metform-pro' ),
			]
		);

		$this->add_control(
			'mf_input_color_focus',
			[
				'label' => esc_html__( 'Input Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-input:focus' => 'color: {{VALUE}}',
				],
				'default' => '#000000',
			]
		);

		$this->add_group_control(
			Group_Control_Background::get_type(),
			[
				'name' => 'mf_input_background_focus',
				'label' => esc_html__( 'Background', 'metform-pro' ),
				'types' => [ 'classic', 'gradient' ],
				'selector' => '{{WRAPPER}} .mf-input:focus',
			]
		);
		
		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_input_border_focus',
				'label' => esc_html__( 'Border', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-input:focus',
			]
		);


		$this->end_controls_tab();

		$this->end_controls_tabs();

		$this->add_control(
			'hr',
			[
				'type' => \Elementor\Controls_Manager::DIVIDER,
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_input_typgraphy',
				'label' => esc_html__( 'Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-input',
			]
		);
		
		$this->add_responsive_control(
			'mf_input_border_radius',
			[
				'label' => esc_html__( 'Border Radius', 'metform-pro' ),
				'type' => Controls_Manager::SLIDER,
				'size_units' => ['px','%'],
				'range' => [
					'px' => [
						'min' => 0,
						'max' => 100,
						'step' => 1,
					],
					'%' => [
						'min' => 0,
						'max' => 100,
					]
				],
				'default' => [
					'unit' => 'px',
					'size' => 0,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-input' => 'border-radius: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name' => 'mf_input_box_shadow',
				'label' => esc_html__( 'Box Shadow', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-input',
			]
		);

        $this->end_controls_section();

        $this->start_controls_section(
			'placeholder_section',
			[
				'label' => esc_html__( 'Place Holder', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->input_place_holder_controls();

		$this->end_controls_section();
        
		$this->insert_pro_message();
	}

    protected function render($instance = []){
        $settings = $this->get_settings_for_display();
		extract($settings);

		$render_on_editor = false;
		$is_edit_mode = 'metform-form' === get_post_type() && \Elementor\Plugin::$instance->editor->is_edit_mode();
		
		$configDataCard = [
			'message' 		=> __("Please enter a valid credit card number.", 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false,
		];
		$configDataName = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : __("Card holder name is required.", 'metform-pro') : __("Card holder name is required.", 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false,
		];
		$configDataMonth = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : __("Valid card expiration date is required.", 'metform-pro') : __("Valid card expiration date is required.", 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false,
		];
		$configDataYear = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : __("Valid card expiration date is required.", 'metform-pro') : __("Valid card expiration date is required.", 'metform-pro'),
			'minLength'		=> date("y"),
			'maxLength'		=> date("y") + 50,
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false,
			'inputType'		=> 'credit_card_date'
		];
		$configDataCVV = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : __("Card security code is required.", 'metform-pro') : __("Card security code is required.", 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false,
			'inputType'		=> 'credit_card_cvv'
		];

		$setting = \MetForm\Core\Admin\Base::instance()->get_settings_option();

		?>

		<div class="mf-input-wrapper mf-credit-card-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label class="mf-input-label" for="mf-input-text-<?php echo esc_attr( $this->get_id() ); ?>">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span class="mf-input-required-indicator"><?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?></span>
				</label>
			<?php endif; ?>
			<div class="mf-card-input-wrapper">
				<div class="mf-card-input mf-card-number-wrapper">
					<span class="mf-card-number-icon mf-card-number-icon-${parent.state.formData['<?php echo esc_attr( $mf_input_name ); ?>--type']}"></span>
					
					<input type="text"
						class="mf-input mf-credit-card-number"
						name="<?php echo esc_attr( $mf_input_name ); ?>"
						id="mf-input-card-number-<?php echo esc_attr( $this->get_id() ); ?>"
						placeholder="<?php esc_html_e( "Card Number", "metform-pro" ); ?>"
						<?php if ( !$is_edit_mode ): ?>
							onChange=${parent.handleCardNumber}
							aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>'] ? 'true' : 'false'}
							ref=${el => parent.activateValidation(<?php echo json_encode($configDataCard); ?>, el)}
						<?php endif; ?>
						/>
				</div>
				<?php if ( !$is_edit_mode ) : ?>
					<${validation.ErrorMessage}
						errors=${validation.errors}
						name="<?php echo esc_attr( $mf_input_name ); ?>"
						as=${html`<span className="mf-error-message"></span>`}
						/>
				<?php endif; ?>

				<div class="mf-card-input mf-card-name-wrapper">
					<input type="text"
						class="mf-input mf-credit-card-name"
						name="<?php echo esc_attr( $mf_input_name ); ?>--name"
						id="mf-input-card-name-<?php echo esc_attr( $this->get_id() ); ?>"
						placeholder="<?php esc_html_e( "Card Holder Name", "metform-pro" ); ?>"
						<?php if ( !$is_edit_mode ): ?>
							onChange=${parent.handleChange}
							aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>--name'] ? 'true' : 'false'}
							ref=${el => parent.activateValidation(<?php echo json_encode($configDataName); ?>, el)}
						<?php endif; ?>
						/>
				</div>
				<?php if ( !$is_edit_mode ) : ?>
					<${validation.ErrorMessage}
						errors=${validation.errors}
						name="<?php echo esc_attr( $mf_input_name ); ?>--name"
						as=${html`<span className="mf-error-message"></span>`}
						/>
				<?php endif; ?>

				<div class="mf-card-info-wrapper">
					<div class="mf-card-info-date">
						<div class="mf-card-input">
							<input type="number"
								class="mf-input mf-credit-card-mm"
								name="<?php echo esc_attr( $mf_input_name ); ?>--mm"
								id="mf-input-card-name-<?php echo esc_attr( $this->get_id() ); ?>"
								placeholder="<?php esc_html_e( "MM", "metform-pro" ); ?>"
								<?php if ( !$is_edit_mode ): ?>
									onInput=${parent.handleCardMonth}
									aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>--mm'] ? 'true' : 'false'}
									ref=${el => parent.activateValidation(<?php echo json_encode($configDataMonth); ?>, el)}
								<?php endif; ?>
								/>
							<input type="number"
								class="mf-input mf-credit-card-yy"
								name="<?php echo esc_attr( $mf_input_name ); ?>--yy"
								id="mf-input-card-name-<?php echo esc_attr( $this->get_id() ); ?>"
								placeholder="<?php esc_html_e( "YY", "metform-pro" ); ?>"
								<?php if ( !$is_edit_mode ): ?>
									onInput=${(e) => {parent.handleSubVal(e, 2)}}
									aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>--yy'] ? 'true' : 'false'}
									ref=${el => parent.activateValidation(<?php echo json_encode($configDataYear); ?>, el)}
								<?php endif; ?>
								/>
						</div>
						<?php if ( !$is_edit_mode ) : ?>
							<${validation.ErrorMessage}
								errors=${validation.errors}
								name="<?php echo esc_attr( $mf_input_name ); ?>--mm"
								as=${html`<span className="mf-error-message"></span>`}
								/>
						<?php endif; ?>

						<?php if ( !$is_edit_mode ) : ?>
							<${validation.ErrorMessage}
								errors=${validation.errors}
								name="<?php echo esc_attr( $mf_input_name ); ?>--yy"
								as=${html`<span className="mf-error-message"></span>`}
								/>
						<?php endif; ?>

						<?php if ( 'yes' == $mf_input_label_status ): ?>
							<label class="mf-input-label" for="mf-input-card-cvv-<?php echo esc_attr( $this->get_id() ); ?>">
								<?php esc_html_e( "Expiration Date", "metform-pro" ) ?>
							</label>
						<?php endif; ?>
					</div>
					
					<div class="mf-card-input mf-card-info-cvv">
						<input type="number"
							class="mf-input mf-credit-card-cvv"
							name="<?php echo esc_attr( $mf_input_name ); ?>--cvv"
							id="mf-input-card-cvv-<?php echo esc_attr( $this->get_id() ); ?>"
							placeholder="<?php esc_html_e( "CVV", "metform-pro" ); ?>"
							<?php if ( !$is_edit_mode ): ?>
								onInput=${e => parent.handleSubVal(e, 3)}
								aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>--cvv'] ? 'true' : 'false'}
								ref=${el => parent.activateValidation(<?php echo json_encode($configDataCVV); ?>, el)}
							<?php endif; ?>
							/>

						<?php if ( !$is_edit_mode ) : ?>
							<${validation.ErrorMessage}
								errors=${validation.errors}
								name="<?php echo esc_attr( $mf_input_name ); ?>--cvv"
								as=${html`<span className="mf-error-message"></span>`}
								/>
						<?php endif; ?>
							
						<?php if ( 'yes' == $mf_input_label_status ): ?>
							<label class="mf-input-label" for="mf-input-card-cvv-<?php echo esc_attr( $this->get_id() ); ?>">
								<?php esc_html_e( "Security Code / CVV", "metform-pro" ) ?>
							</label>
						<?php endif; ?>
					</div>
				</div>
				<?php
				if ( $mf_input_help_text != '' ):
					echo '<span class="mf-input-help">'. \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_help_text), $render_on_editor ) .'</span>';
				endif;
				?>
			</div>
		</div>

		<?php
    }
    
}
