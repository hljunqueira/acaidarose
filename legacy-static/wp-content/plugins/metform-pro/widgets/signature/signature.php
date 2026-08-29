<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Input_Signature extends Widget_Base{

	use \MetForm\Traits\Common_Controls;
    use \MetForm\Traits\Conditional_Controls;
    
    public function __construct( $data = [], $args = null ) {
		parent::__construct( $data, $args );

		if ( class_exists('\Elementor\Icons_Manager') && method_exists('\Elementor\Icons_Manager', 'enqueue_shim') ) {
			\Elementor\Icons_Manager::enqueue_shim();
		}
	}

    public function get_name() {
		return 'mf-signature';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_signature_field';
	}
    
	public function get_title() {
		return esc_html__( 'Signature', 'metform-pro' );
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
        return [ 'metform-pro', 'input', 'signature', 'digital sign', 'electronic sign' ];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list/#signature';
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
					'{{WRAPPER}} .mf-signature-label' => 'display: {{VALUE}}; vertical-align: top',
					'{{WRAPPER}} .mf-signature' => 'display: {{VALUE}}; vertical-align: top',
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
				'label' => esc_html__( 'Input Label : ', 'metform-pro' ),
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
				'frontend_available' => true,
				'title' => esc_html__( 'Enter here name of the input', 'metform-pro' ),
				'description' => esc_html__('Name is must required. Enter name without space or any special character. use only underscore/ hyphen (_/-) for multiple word. Name must be different.', 'metform-pro'),
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

		// $this->add_control(
		// 	'signature_icon',
		// 	[
        //         'label' => esc_html__( 'Refresh Icon:', 'metform-pro' ),
		// 		'type' => Controls_Manager::ICONS,
		// 		'default' => ['value' => 'fa fa-refresh'],
		// 	]
		// );

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
					'{{WRAPPER}} .mf-signature-label' => 'width: {{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .mf-signature' => 'width: calc(100% - {{SIZE}}{{UNIT}})',
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
					'{{WRAPPER}} .mf-signature-label' => 'color: {{VALUE}}',
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
				'selector' => '{{WRAPPER}} .mf-signature-label',
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
					'{{WRAPPER}} .mf-signature-label' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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
					'{{WRAPPER}} .mf-signature-label' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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
				'selector' => '{{WRAPPER}} .mf-signature-label',
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
					'{{WRAPPER}} .mf-signature canvas[aria-invalid="true"]' => 'border-color: {{VALUE}}',
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
            'signature_canvas_styles',
            [
                'label' => esc_html__('Signature Canvas', 'metform-pro'),
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
						'{{WRAPPER}} .mf-signature canvas' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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
						'{{WRAPPER}} .mf-signature canvas' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					],
				]
			);

			$this->add_responsive_control(
				'signature_canvas_radius',
				[
					'label' => esc_html__( 'Border Radius', 'metform-pro' ),
					'type' => Controls_Manager::DIMENSIONS,
					'size_units' => [ 'px', '%', 'em' ],
					'selectors' => [
						'{{WRAPPER}} .mf-signature canvas' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					],
				]
			);

			$this->add_group_control(
				Group_Control_Box_Shadow::get_type(),
				[
					'name' => 'mf_input_box_shadow',
					'label' => esc_html__( 'Box Shadow', 'metform-pro' ),
					'selector' => '{{WRAPPER}} .mf-signature canvas',
				]
			);

			$this->add_control(
				'mf_input_color',
				[
					'label' => esc_html__( 'Pen Color', 'metform-pro' ),
					'type' => Controls_Manager::COLOR,
				]
			);

			$this->add_control(
				'hr',
				[
					'type' => \Elementor\Controls_Manager::DIVIDER,
				]
			);

			$this->start_controls_tabs( 'mf_input_tabs_style' );
				$this->start_controls_tab(
					'signature_canvas_normal',
					[
						'label' =>esc_html__( 'Normal', 'metform-pro' ),
					]
				);
					$this->add_group_control(
						Group_Control_Background::get_type(),
						[
							'name' => 'mf_input_background',
							'label' => esc_html__( 'Background', 'metform-pro' ),
							'types' => [ 'classic', 'gradient' ],
							'selector' => '{{WRAPPER}} .mf-signature canvas',
						]
					);

					$this->add_group_control(
						Group_Control_Border::get_type(),
						[
							'name' => 'mf_input_border',
							'label' => esc_html__( 'Border', 'metform-pro' ),
							'selector' => '{{WRAPPER}} .mf-signature canvas',
						]
					);
				$this->end_controls_tab();
				
				$this->start_controls_tab(
					'signature_canvas_hover',
					[
						'label' =>esc_html__( 'Hover', 'metform-pro' ),
					]
				);
					$this->add_group_control(
						Group_Control_Background::get_type(),
						[
							'name' => 'mf_input_background_hover',
							'label' => esc_html__( 'Background', 'metform-pro' ),
							'types' => [ 'classic', 'gradient' ],
							'selector' => '{{WRAPPER}} .mf-signature canvas:hover',
						]
					);
					
					$this->add_group_control(
						Group_Control_Border::get_type(),
						[
							'name' => 'mf_input_border_hover',
							'label' => esc_html__( 'Border', 'metform-pro' ),
							'selector' => '{{WRAPPER}} .mf-signature canvas:not([aria-invalid="true"]):hover',
						]
					);
				$this->end_controls_tab();
			$this->end_controls_tabs( );
        $this->end_controls_section();

        $this->start_controls_section(
            'signature_icon_styles',
            [
                'label' => esc_html__('Refresh Icon', 'metform-pro'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );
			$this->add_control(
				'signature_icon_color',
				[
					'label' => esc_html__( 'Color', 'metform-pro' ),
					'type' => Controls_Manager::COLOR,
					'selectors' => [
						'{{WRAPPER}} .m-signature-pad--footer' => 'color: {{VALUE}};',
					],
				]
			);
			
			$this->add_control(
				'signature_icon_font',
				[
					'label' => esc_html__( 'Font Size', 'metform-pro' ),
					'type' => Controls_Manager::SLIDER,
					'selectors' => [
						'{{WRAPPER}} .m-signature-pad--footer > button:before' => 'font-size: {{SIZE}}{{UNIT}};',
					],
				]
			);
			
			$this->add_control(
				'signature_icon_spacing',
				[
					'label' => esc_html__( 'Spacing', 'metform-pro' ),
					'type' => Controls_Manager::SLIDER,
					'selectors' => [
						'{{WRAPPER}} .m-signature-pad--footer' => 'padding: {{SIZE}}{{UNIT}};',
					],
				]
			);
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
	}

    protected function render($instance = []){
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

		$uid = $this->get_id() .'-'. $mf_input_name;

		$configData = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : esc_html__('This field is required.', 'metform-pro') : esc_html__('This field is required.', 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false,
		];
		?>

		<?php echo $inputWrapStart; ?>

		<div className="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label className="mf-signature-label mf-input-label">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span className="mf-input-required-indicator"><?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?></span>
				</label>
			<?php endif; ?>

			<div className="mf-signature" id="mf-input-signature-<?php echo esc_attr($this->get_id()); ?>" aria-invalid=${validation.errors[ '<?php echo esc_attr($mf_input_name); ?>' ] ? 'true' : 'false'}>
				<${props.SignaturePad}
					clearButton="true"
					penColor="<?php echo esc_attr( $mf_input_color ); ?>"
					name="<?php echo esc_attr( $mf_input_name ); ?>"
					onEnd=${function () { parent.handleSignature(this) }}
					/>
				
				<input
					type="hidden"
					name="<?php echo esc_attr( $mf_input_name ); ?>"
					className="mf-input mf-signature-hidden"
					value=${ parent.getValue( '<?php echo esc_attr( $mf_input_name ); ?>' ) }
					ref=${ (el) => parent.activateValidation(<?php echo json_encode($configData); ?>, el) }
					/>
			</div>

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
