<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Input_Toggle_Select extends Widget_Base{

	use \MetForm\Traits\Common_Controls;
	use \MetForm\Traits\Conditional_Controls;
	use \MetForm_Pro\Traits\Quiz_Control;

    public function get_name() {
		return 'mf-toggle-select';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_toggle_switch';
	}

	public function get_title() {
		return esc_html__( 'Toggle select', 'metform-pro' );
	}
	public function show_in_panel() {
        return 'metform-form' == get_post_type();
	}

	public function has_widget_inner_wrapper(): bool {
		return ! Plugin::$instance->experiments->is_feature_active('e_optimized_markup');
	}

	public function get_categories() {
		return [ 'metform-pro' ];
	}

	public function get_keywords() {
        return ['metform-pro', 'input', 'select', 'toggle'];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list/#toggle-select';
    }

    protected function register_controls() {

		$this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'Content', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);

		if ( $this->get_form_type() == 'quiz-form' && class_exists('\MetForm_Pro\Base\Package') ){
			$this->quiz_controls(['toggle-select']);

		} else {

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
						'{{WRAPPER}} .mf-toggle-select-label' => 'display: {{VALUE}}; vertical-align: top',
						'{{WRAPPER}} .mf-toggle-select' => 'display: inline-block',
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
						'{{WRAPPER}} .mf-toggle-select-option' => 'display: {{VALUE}};',
					],
					'description' => esc_html__('Toggle select option display style.', 'metform-pro'),
				]
			);
	
			$this->add_control(
				'mf_input_options_multiselect',
				[
					'label' => esc_html__( 'Select Type : ', 'metform-pro' ),
					'type' => Controls_Manager::SELECT,
					'default' => 'solid',
					'options' => [
						'radio'		=> esc_html__( 'Single Select', 'metform-pro' ),
						'checkbox'	=> esc_html__( 'Multi Select', 'metform-pro' ),
					],
					'default' => 'radio',
				]
			);
	
			$input_fields = new Repeater();
	
			$input_fields->add_control(
				'mf_input_option_text',
				[
					'label' => esc_html__( 'Toggle for select', 'metform-pro' ),
					'type' => Controls_Manager::TEXT,
					'default' => esc_html__( 'toggle', 'metform-pro' ),
					'placeholder' => esc_html__( 'Enter here toggle text', 'metform-pro' ),
				]
			);
	
			$input_fields->add_control(
				'mf_input_option_value', [
					'label' => esc_html__( 'Option Value', 'metform-pro' ),
					'type' => Controls_Manager::TEXT,
					'default' => esc_html__( 'value' , 'metform-pro' ),
					'label_block' => true,
					'description' => esc_html__('Select option value that will be store/mail to desired person.', 'metform-pro'),
				]
			);
			$input_fields->add_control(
				'mf_input_option_status', [
					'label' => esc_html__( 'Option Status', 'metform-pro' ),
					'type' => Controls_Manager::SELECT,
					'options' => [
						''  => esc_html__( 'Active', 'metform-pro' ),
						'disabled' => esc_html__( 'Disable', 'metform-pro' ),
					],
					'default' => '',
					'label_block' => true,
					'description' => esc_html__('Want to make a option? which user can see the option but can\'t select it. make it disable.', 'metform-pro'),
				]
			);
	
			$input_fields->add_control(
				'mf_input_option_default_value', [
						'label' => esc_html__( 'Select it default ?', 'metform-pro' ),
						'type' => Controls_Manager::SWITCHER,
						'yes' => esc_html__( 'Yes', 'metform-pro' ),
						'no' => esc_html__( 'No', 'metform-pro' ),
						'return_value' => 'yes',
						'default' => 'no',
					]
			);
	
			$input_fields->add_control(
				'mf_input_icon_status',
				[
					'label' => esc_html__( 'Add	 Icon', 'metform-pro' ),
					'type' => Controls_Manager::SWITCHER,
					'label_on' => esc_html__( 'Show', 'metform-pro' ),
					'label_off' => esc_html__( 'Hide', 'metform-pro' ),
					'return_value' => 'yes',
					'default' => '',
					'separator' => 'before',
				]
			);
			$input_fields->add_control(
				'mf_input_icon',
				[
					'label' =>esc_html__( 'Icon', 'metform-pro' ),
					'type' => Controls_Manager::ICONS,
					'label_block' => true,
					'default' => [
						'value' => 'fas fa-star',
						'library' => 'solid',
					],
					'condition' => [
						'mf_input_icon_status' => 'yes',
					],
				]
			);
	
			$input_fields->add_control(
				'mf_input_icon_align',
				[
					'label' =>esc_html__( 'Icon Position', 'metform-pro' ),
					'type' => Controls_Manager::SELECT,
					'default' => 'left',
					'options' => [
						'left' =>esc_html__( 'Before', 'metform-pro' ),
						'right' =>esc_html__( 'After', 'metform-pro' ),
					],
					'condition' => [
						'mf_input_icon_status' => 'yes',
					],
				]
			);
	
			$this->add_control(
				'mf_input_list',
				[
					'label' => esc_html__( 'Toggle select Options', 'metform-pro' ),
					'type' => Controls_Manager::REPEATER,
					'fields' => $input_fields->get_controls(),
					'default' => [
						[
							'mf_input_option_text' => 'toggle-1',
							'mf_input_option_value' => 'toggle-1',
							'mf_input_option_status' => '',
						],
						[
							'mf_input_option_text' => 'toggle-2',
							'mf_input_option_value' => 'toggle-2',
							'mf_input_option_status' => '',
						],
						[
							'mf_input_option_text' => 'toggle-3',
							'mf_input_option_value' => 'toggle-3',
							'mf_input_option_status' => '',
						],
					],
					'title_field' => '{{{ mf_input_option_text }}}',
					'description' => esc_html__('You can add/edit here your selector options.', 'metform-pro'),
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
		}

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

    	if ( $this->get_form_type() == 'quiz-form' && class_exists('\MetForm_Pro\Base\Package') ) {
			$this->start_controls_section(
				'label_section',
				[
					'label' => esc_html__( 'Input Label', 'metform-pro' ),
					'tab' => Controls_Manager::TAB_STYLE,
				]
			);

		} else {
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
		}

		$this->add_control(
			'mf_input_label_color',
			[
                'label' => esc_html__( 'Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-toggle-select-label' => 'color: {{VALUE}}',
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
				'selector' => '{{WRAPPER}} .mf-toggle-select-label',
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
					'{{WRAPPER}} .mf-toggle-select-label' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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
					'{{WRAPPER}} .mf-toggle-select-label' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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
				'selector' => '{{WRAPPER}} .mf-toggle-select-label',
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
                'label' => esc_html__('Toggle', 'metform-pro'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
			'mf_input_option_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%', 'em' ],
				'default' => 	[
					'top' => '10',
					'right' => '50',
					'bottom' => '10',
					'left' => '50',
					'unit' => 'px',
				],
				'selectors' => [
					'{{WRAPPER}} .mf-toggle-select-option .attr-btn-info' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);
		$this->add_responsive_control(
			'mf_input_option_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%', 'em' ],
				'default' => 	[
					'top' => '5',
					'right' => '5',
					'bottom' => '5',
					'left' => '5',
					'unit' => 'px',
				],
				'selectors' => [
					'{{WRAPPER}} .mf-toggle-select-option .attr-btn-info' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_responsive_control(
            'mf_input_option_margin_border_radius',
            [
                'label' => esc_html__( 'Border Radius', 'metform-pro' ),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
                'selectors' => [
                    '{{WRAPPER}} .mf-toggle-select-option .attr-btn-info' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
			'select_or_normal_or_hover_style',
			[
				'label' => esc_html__( 'Make changes on select and normal', 'metform-pro' ),
				'type' => Controls_Manager::HEADING,
				'separator' => 'before',
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
            'mf_input_option_font_color_normal',
            [
                'label' => esc_html__( 'Font Color', 'metform-pro' ),
                'type' => Controls_Manager::COLOR,
                'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'default' => '#333',
                'selectors' => [
                    '{{WRAPPER}} .mf-toggle-select-option input[type="radio"] + span' => 'color: {{VALUE}}',
                    '{{WRAPPER}} .mf-toggle-select-option input[type="checkbox"] + span' => 'color: {{VALUE}}',
                ],
            ]
        );

        $this->add_control(
			'mf_input_option_background_color_normal',
			[
				'label' => esc_html__( 'Background Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
                'default' => '#fff',
				'selectors' => [
					'{{WRAPPER}} .mf-toggle-select-option input[type="radio"] + span' => 'background-color: {{VALUE}}',
					'{{WRAPPER}} .mf-toggle-select-option input[type="checkbox"] + span' => 'background-color: {{VALUE}}',
				],
			]
        );

        $this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_input_option_border_style_normal',
                'selector' => '{{WRAPPER}} .mf-toggle-select-option input[type="radio"] + span, {{WRAPPER}} .mf-toggle-select-option input[type="checkbox"] + span',
                'fields_options' => [
                    'border' => [
                        'label' =>  esc_html__( 'Normal border style', 'metform-pro' ),
                        'default' => 'solid',
                    ],
                    'width' => [
                        'default' => [
                            'top' => '1',
                            'right' => '1',
                            'bottom' => '1',
                            'left' => '1',
                            'isLinked' => true,
                        ],
                    ],
                    'color' => [
                        'default' => '#ededed',
                    ],
                ],
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
            'mf_input_option_font_color_hover',
            [
                'label' => esc_html__( 'Font Color', 'metform-pro' ),
                'type' => Controls_Manager::COLOR,
                'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'default' => '#fff',
                'selectors' => [
                    '{{WRAPPER}} .mf-toggle-select-option input[type="radio"] + span:hover' => 'color: {{VALUE}}',
                    '{{WRAPPER}} .mf-toggle-select-option input[type="checkbox"] + span:hover' => 'color: {{VALUE}}',
                ],
            ]
        );

        $this->add_control(
			'mf_input_option_background_color_hover',
			[
				'label' => esc_html__( 'Background Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
                'default' => '#1F55F8',
				'selectors' => [
					'{{WRAPPER}} .mf-toggle-select-option input[type="radio"] + span:hover' => 'background-color: {{VALUE}}',
					'{{WRAPPER}} .mf-toggle-select-option input[type="checkbox"] + span:hover' => 'background-color: {{VALUE}}',
				],
			]
        );

        $this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_input_option_border_style_hover',
                'selector' => '{{WRAPPER}} .mf-toggle-select-option input[type="radio"] + span:hover, {{WRAPPER}} .mf-toggle-select-option input[type="checkbox"] + span:hover',
                'fields_options' => [
                    'border' => [
                        'label' =>  esc_html__( 'Hover border style', 'metform-pro' ),
                        'default' => 'solid',
                    ],
                    'width' => [
                        'default' => [
                            'top' => '1',
                            'right' => '1',
                            'bottom' => '1',
                            'left' => '1',
                            'isLinked' => true,
                        ],
                    ],
                    'color' => [
                        'default' => '#1F55F8',
                    ],
                ],
			]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'mf_input_tabselect',
            [
                'label' =>esc_html__( 'Select', 'metform-pro' ),
            ]
        );

        $this->add_control(
            'mf_input_option_font_color_select',
            [
                'label' => esc_html__( 'Font Color', 'metform-pro' ),
                'type' => Controls_Manager::COLOR,
                'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'default' => '#fff',
                'selectors' => [
                    '{{WRAPPER}} .mf-toggle-select-option input[type="radio"]:checked + span' => 'color: {{VALUE}}',
                    '{{WRAPPER}} .mf-toggle-select-option input[type="checkbox"]:checked + span' => 'color: {{VALUE}}',
                ],
            ]
        );

        $this->add_control(
			'mf_input_option_background_color_select',
			[
				'label' => esc_html__( 'Background Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'default'	=> '#1F55F8',
				'selectors' => [
					'{{WRAPPER}} .mf-toggle-select-option input[type="radio"]:checked + span' => 'background-color: {{VALUE}}',
					'{{WRAPPER}} .mf-toggle-select-option input[type="checkbox"]:checked + span' => 'background-color: {{VALUE}}',
				],
			]
        );

        $this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_input_option_border_style_selected',
                'selector' => '{{WRAPPER}} .mf-toggle-select-option input[type="radio"]:checked + span, {{WRAPPER}} .mf-toggle-select-option input[type="checkbox"]:checked + span',
                'fields_options' => [
                    'border' => [
                        'label' =>  esc_html__( 'Selected border style', 'metform-pro' ),
                        'default' => 'solid',
                    ],
                    'width' => [
                        'default' => [
                            'top' => '1',
                            'right' => '1',
                            'bottom' => '1',
                            'left' => '1',
                            'isLinked' => true,
                        ],
                    ],
                    'color' => [
                        'default' => '#1F55F8',
                    ],
                ],
			]
		);

        $this->end_controls_tab();

        $this->end_controls_tabs();

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_input_typgraphy',
				'label' => esc_html__( 'Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-toggle-select, {{WRAPPER}} .mf-toggle-select-option input[type="radio"] + span, {{WRAPPER}} .mf-toggle-select-option input[type="checkbox"] + span',
			]
        );

		$this->end_controls_section();

        $this->start_controls_section(
			'mf_input_icon_style',
			[
				'label' =>esc_html__( 'Icon', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
        );

        $this->add_responsive_control(
			'mf_input_icon_font_size',
			array(
				'label'      => esc_html__( 'Font Size', 'metform-pro' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => array(
					'px', 'em', 'rem',
				),
				'range'      => array(
					'px' => array(
						'min' => 1,
						'max' => 100,
					),
				),
				'selectors'  => array(
					'{{WRAPPER}} .mf-input-toggle-option i' => 'font-size: {{SIZE}}{{UNIT}}',
				),
			)
        );

        $this->add_responsive_control(
            'mf_input_icon_vertical_align',
            array(
                'label'      => esc_html__( 'Vertical Align', 'metform-pro' ),
                'type'       => Controls_Manager::SLIDER,
                'size_units' => array(
                    'px', 'em', 'rem',
                ),
                'range'      => array(
                    'px' => array(
                        'min' => -20,
                        'max' => 20,
                    ),
                    'em' => array(
                        'min' => -5,
                        'max' => 5,
                    ),
                    'rem' => array(
                        'min' => -5,
                        'max' => 5,
                    ),
                ),
                'selectors'  => array(
                    '{{WRAPPER}} .mf-input-toggle-option i' => ' -webkit-transform: translateY({{SIZE}}{{UNIT}}); -ms-transform: translateY({{SIZE}}{{UNIT}}); transform: translateY({{SIZE}}{{UNIT}})',
                ),
            )
        );

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

		$configData = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : esc_html__('This field is required.', 'metform-pro') : esc_html__('This field is required.', 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false
		];

		$mf_default_input_list = isset($mf_input_list) ? array_values(array_filter($mf_input_list, function($item){
			if(isset($item['mf_input_option_default_value']) && $item['mf_input_option_default_value'] === 'yes'){

			    return $item["mf_input_option_value"];
			}
			return false;
		 })) : array();

		 if($mf_input_options_multiselect === 'radio'){			
			$mf_default_input_list = array_slice($mf_default_input_list, -1, 1);
		}
		
		$default_value =  count($mf_default_input_list) > 0 ? array_column($mf_default_input_list, 'mf_input_option_value') : array();

		if(!$is_edit_mode && isset($mf_quiz_point) && class_exists('\MetForm_Pro\Base\Package')){
			$answer_list = isset($mf_input_list) ? array_values(array_filter($mf_input_list, function($item){
				if(isset($item['mf_quiz_question_answer']) && !empty($item['mf_quiz_question_answer'])){
					return $item["mf_input_option_value"];
				}
				return false;
			})) : array();
	
			$answers = count($answer_list) > 0 ? array_column($answer_list, 'mf_input_option_value') : array();
			$answer = count($answers) > 0 ? $answers[count($answers) - 1] : "";
			$quizDataCheckbox = array("answer" => $answers, "correctPoint" => esc_attr($mf_quiz_point ?? 0), "incorrectPoint" => esc_attr($mf_quiz_negative_point ?? 0));
			$quizDataRadio = array("answer" => $answer, "correctPoint" => esc_attr($mf_quiz_point ?? 0), "incorrectPoint" => esc_attr($mf_quiz_negative_point ?? 0));
		}
		?>

		<div class="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label class="mf-toggle-select-label mf-input-label">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span class="mf-input-required-indicator"><?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?></span>
				</label>
			<?php endif; ?>

			<div class="mf-toggle-select" id="mf-input-toggle-select-<?php echo esc_attr($this->get_id()); ?>">
				<?php
				foreach($mf_input_list as $key => $option) { ?>
					<div class="mf-toggle-select-option <?php echo esc_attr($option['mf_input_option_status']); ?>">
						<label class="mf-input-toggle-option">
							<input type="<?php echo esc_html( $mf_input_options_multiselect ); ?>"
							class="mf-input mf-toggle-select-input <?php echo $class; ?>"
							name="<?php echo esc_attr($mf_input_name); ?>"
							value="<?php echo esc_attr($option['mf_input_option_value']); ?>"
							defaultChecked="<?php echo in_array($option['mf_input_option_value'], array_column($mf_default_input_list, 'mf_input_option_value')) ? true : false; ?>"
							<?php echo esc_attr($option['mf_input_option_status'] === 'disabled' ? 'disabled' : ''); ?>
							<?php if ( !$is_edit_mode ): ?>
								<?php if ( $mf_input_options_multiselect === 'checkbox' ): ?>
								onInput=${event => {
									parent.handleCheckbox(event.target, 'onClick')
								}}
								<?php else : ?>
								onInput=${parent.handleChange}
								<?php endif; ?>
								aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>'] ? 'true' : 'false'}
								ref=${(el) => {
									<?php if ( isset($quizDataCheckbox) && $mf_input_options_multiselect == 'checkbox' && ($quizDataCheckbox['correctPoint'] != 0 || $quizDataCheckbox['incorrectPoint'] != 0) ) { ?>
										!parent.state.answers["<?php echo esc_attr($mf_input_name); ?>"] && (
										parent.state.answers["<?php echo esc_attr($mf_input_name); ?>"] = <?php echo json_encode($quizDataCheckbox); ?>)
									<?php } elseif (isset($quizDataRadio) && $mf_input_options_multiselect == 'radio' && ($quizDataRadio['correctPoint'] != 0 || $quizDataRadio['incorrectPoint'] != 0) ) { ?>
										!parent.state.answers["<?php echo esc_attr($mf_input_name); ?>"] && (
										parent.state.answers["<?php echo esc_attr($mf_input_name); ?>"] = <?php echo json_encode($quizDataRadio); ?>)
									<?php } ?>
									if(parent.state?.submitted !== true){
										if ( parent.getValue("<?php echo esc_attr($mf_input_name); ?>") === '' && <?php echo (count($mf_default_input_list) > 0) ? 'true' : 'false'; ?> ) {
											register({ name: "<?php echo esc_attr($mf_input_name); ?>" }, parent.activateValidation(<?php echo json_encode($configData); ?>));
											if ( "<?php echo $mf_input_options_multiselect ?>" ==='checkbox' ){
												<?php 
												if ( version_compare( \MetForm\Plugin::instance()->version(), '2.2.1', '>' ) ) {
													?>
													parent.setValue( '<?php echo esc_attr($mf_input_name); ?>', '<?php echo json_encode($default_value); ?>');
													parent.multiSelectChange('<?php echo json_encode($mf_default_input_list)?>', '<?php echo esc_attr($mf_input_name); ?>');
													<?php
												}
												?>
											} else {
												parent.setValue( '<?php echo esc_attr($mf_input_name); ?>', '<?php echo json_encode($default_value); ?>');
												parent.handleChange({
													target: {
														name: '<?php echo esc_attr($mf_input_name); ?>',
														value: '<?php echo (count($mf_default_input_list) > 0) ? esc_attr( $mf_default_input_list[0]["mf_input_option_value"] ) : ''; ?>'
													}
												});
											}
										} else {
											parent.activateValidation(<?php echo json_encode($configData); ?>, el);
										}
									} else {
										parent.activateValidation(<?php echo json_encode($configData); ?>, el);
									}
								}}
							<?php endif; ?>

							/>
							<span class="attr-btn attr-btn-info">
								<?php if(isset($option['mf_input_icon']['value']) && $option['mf_input_icon']['value'] != '' && $option['mf_input_icon_status'] == 'yes' && $option['mf_input_icon_align'] == 'left' ): ?>
									<?php 
										if(is_array( $option['mf_input_icon']['value'] )){
											?> <img src="<?php echo $option['mf_input_icon']['value']['url'] ?>" alt="svg-image"/> <?php 
										}else{
											?> <i class="<?php echo $option['mf_input_icon']['value']?>"></i> <?php 
										}
										 
									?>

								<?php endif; ?>
								<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($option['mf_input_option_text']), $render_on_editor ); ?>
								<?php if(isset($option['mf_input_icon']['value']) && $option['mf_input_icon']['value'] != '' && $option['mf_input_icon_status'] == 'yes' && $option['mf_input_icon_align'] == 'right' ): ?>
							
									<?php 
										if(is_array( $option['mf_input_icon']['value'] )){
											?> <img src="<?php echo $option['mf_input_icon']['value']['url'] ?>" alt="svg-image"/> <?php 
										}else{
											?> <i class="<?php echo $option['mf_input_icon']['value']?>"></i> <?php 
										}
										 
									?>
									
								<?php endif; ?>
							</span>
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
